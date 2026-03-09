import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ContainerStatus } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '../prisma/prisma.service';
import { BatchActionDto } from './dto/batch-action.dto';
import {
  getTargetStatus,
  getValidActions,
  isValidForAction,
  ALL_ACTIONS,
} from './container-state-machine';

const DEFAULT_SUBCULTURE_INTERVAL = 28;

@Injectable()
export class ContainersService {
  private readonly logger = new Logger(ContainersService.name);

  private static readonly VALID_DISCARD_REASONS: readonly string[] = [
    'contamination',
    'senescence',
    'experiment_end',
    'other',
  ];

  constructor(private readonly prisma: PrismaService) {}

  /* ------------------------------------------------------------------ */
  /*  QR code format validation                                          */
  /* ------------------------------------------------------------------ */

  private isValidQrCode(qr: unknown): qr is string {
    return typeof qr === 'string' && qr.length > 0 && qr === qr.trim();
  }

  /* ------------------------------------------------------------------ */
  /*  Single container by QR code                                       */
  /* ------------------------------------------------------------------ */

  async findByQr(qr: string) {
    const container = await this.prisma.container.findUnique({
      where: { qrCode: qr },
      include: {
        containerType: true,
        media: { include: { recipe: true } },
        culture: true,
        parent: true,
        children: true,
        logs: {
          include: { employee: true },
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!container) {
      throw new NotFoundException(`Container ${qr} not found`);
    }

    return container;
  }

  /* ------------------------------------------------------------------ */
  /*  List containers (optionally filtered by status)                   */
  /* ------------------------------------------------------------------ */

  async findAll(status?: ContainerStatus) {
    return this.prisma.container.findMany({
      where: status ? { status } : undefined,
      include: {
        containerType: true,
        culture: true,
        media: { include: { recipe: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Quick QR-code lookup (autocomplete / scanner)                     */
  /* ------------------------------------------------------------------ */

  async lookup(q: string) {
    return this.prisma.container.findMany({
      where: { qrCode: { contains: q } },
      take: 20,
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Validate action for multiple QR codes                             */
  /* ------------------------------------------------------------------ */

  async validateAction(action: string, qrCodes: string[]) {
    if (!ALL_ACTIONS.includes(action)) {
      throw new BadRequestException(
        `Unknown action "${action}". Valid actions: ${ALL_ACTIONS.join(', ')}`,
      );
    }

    const results: {
      qrCode: string;
      valid: boolean;
      status: ContainerStatus | null;
      reason?: string;
    }[] = [];

    for (const qr of qrCodes) {
      const container = await this.prisma.container.findUnique({
        where: { qrCode: qr },
      });

      const currentStatus = container?.status ?? null;
      const valid = isValidForAction(currentStatus, action);

      results.push({
        qrCode: qr,
        valid,
        status: currentStatus,
        reason: valid
          ? undefined
          : currentStatus === null
            ? 'Not registered'
            : `Container must be ${this.getValidStatusesText(action)} for ${action}`,
      });
    }

    return { results };
  }

  private getValidStatusesText(action: string): string {
    const validActions: Record<string, string> = {
      REGISTER_CONTAINER: 'unregistered',
      PREPARE_MEDIA: 'EMPTY',
      ADD_CULTURE: 'HAS_MEDIA',
      DISCARD_CULTURE: 'HAS_CULTURE',
      DISCARD_CONTAINER: 'EMPTY, HAS_MEDIA, or HAS_CULTURE',
      SUBCULTURE: 'HAS_CULTURE',
      EXIT_CULTURE: 'HAS_CULTURE',
      WASH: 'DISCARDED',
    };
    return validActions[action] ?? 'unknown';
  }

  /* ------------------------------------------------------------------ */
  /*  Batch action (scan multiple containers, apply same action)        */
  /* ------------------------------------------------------------------ */

  async batchAction(dto: BatchActionDto) {
    const { qrCodes, action, payload, employeeId } = dto;

    // Validate employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });
    if (!employee) {
      throw new BadRequestException(`Employee ${employeeId} not found`);
    }

    const targetStatus = getTargetStatus(action);
    if (!targetStatus) {
      throw new BadRequestException(
        `Unknown action "${action}". Valid actions: ${ALL_ACTIONS.join(', ')}`,
      );
    }

    const results: { qrCode: string; status: ContainerStatus }[] = [];
    const errors: { qrCode: string; reason: string }[] = [];

    for (const qr of qrCodes) {
      try {
        // Bug 8: QR code format validation
        if (!this.isValidQrCode(qr)) {
          errors.push({
            qrCode: qr,
            reason:
              'Invalid QR code format: must be a non-empty string with no leading/trailing whitespace',
          });
          continue;
        }

        if (action === 'REGISTER_CONTAINER') {
          const existing = await this.prisma.container.findUnique({
            where: { qrCode: qr },
          });
          if (existing) {
            errors.push({
              qrCode: qr,
              reason: 'Container already registered',
            });
            continue;
          }

          // Validate containerTypeId exists if provided
          if (payload?.containerTypeId) {
            const ct = await this.prisma.containerType.findUnique({
              where: { id: payload.containerTypeId },
            });
            if (!ct) {
              errors.push({
                qrCode: qr,
                reason: `Container type ${payload.containerTypeId} not found`,
              });
              continue;
            }
          }

          const created = await this.prisma.$transaction(async (tx) => {
            const container = await tx.container.create({
              data: {
                qrCode: qr,
                status: ContainerStatus.EMPTY,
                containerTypeId: payload?.containerTypeId ?? null,
                notes: payload?.note ?? null,
              },
            });

            await tx.actionLog.create({
              data: {
                action,
                performedBy: employeeId,
                containerQr: qr,
                previousStatus: null,
                newStatus: ContainerStatus.EMPTY,
                note: payload?.note ?? null,
                metadata: JSON.stringify({
                  containerTypeId: payload?.containerTypeId,
                }),
              },
            });

            return container;
          });

          results.push({ qrCode: created.qrCode, status: created.status });
          continue;
        }

        // Bug 3: Validate required mediaBatchId for PREPARE_MEDIA
        if (action === 'PREPARE_MEDIA' && !payload?.mediaBatchId) {
          errors.push({
            qrCode: qr,
            reason: 'PREPARE_MEDIA requires a mediaBatchId',
          });
          continue;
        }

        // Bug 4: Validate required cultureTypeId for ADD_CULTURE
        if (action === 'ADD_CULTURE' && !payload?.cultureTypeId) {
          errors.push({
            qrCode: qr,
            reason: 'ADD_CULTURE requires a cultureTypeId',
          });
          continue;
        }

        // Bug 5: Validate required reason for DISCARD actions
        if (action === 'DISCARD_CULTURE' || action === 'DISCARD_CONTAINER') {
          const reason = payload?.reason;
          if (
            !reason ||
            !ContainersService.VALID_DISCARD_REASONS.includes(reason)
          ) {
            errors.push({
              qrCode: qr,
              reason: `${action} requires a valid reason: ${ContainersService.VALID_DISCARD_REASONS.join(', ')}`,
            });
            continue;
          }
        }

        // Bug 1 & 2: All container reads and validations inside the transaction
        const txResult = await this.prisma.$transaction(
          async (
            tx,
          ): Promise<
            | { error: string }
            | { error: null; qrCode: string; status: ContainerStatus }
          > => {
            // Re-read container inside transaction for fresh data
            const container = await tx.container.findUnique({
              where: { qrCode: qr },
              include: { culture: true },
            });

            if (!container) {
              return { error: 'Container not found' };
            }

            // Re-validate status inside transaction
            if (!isValidForAction(container.status, action)) {
              return {
                error: `Cannot perform ${action} on container with status ${container.status}. Valid actions: ${getValidActions(container.status).join(', ')}`,
              };
            }

            // Build the update data depending on the action
            const updateData: Record<string, unknown> = {
              status: targetStatus,
            };
            const metadataObj: Record<string, unknown> = {};

            switch (action) {
              case 'PREPARE_MEDIA':
                if (payload?.mediaBatchId) {
                  updateData.mediaId = payload.mediaBatchId;
                  metadataObj.mediaBatchId = payload.mediaBatchId;
                }
                break;

              case 'ADD_CULTURE': {
                if (payload?.cultureTypeId) {
                  updateData.cultureId = payload.cultureTypeId;
                  metadataObj.cultureTypeId = payload.cultureTypeId;
                }
                if (payload?.parentQr) {
                  updateData.parentId = payload.parentQr;
                  metadataObj.parentQr = payload.parentQr;
                }
                updateData.cultureDate = new Date();

                // Calculate due subculture date
                if (payload?.dueSubcultureDate) {
                  updateData.dueSubcultureDate = new Date(
                    payload.dueSubcultureDate,
                  );
                } else {
                  const interval =
                    payload?.subcultureInterval ??
                    container.culture?.defaultSubcultureInterval ??
                    DEFAULT_SUBCULTURE_INTERVAL;
                  updateData.subcultureInterval = interval;
                  const due = new Date();
                  due.setDate(due.getDate() + interval);
                  updateData.dueSubcultureDate = due;
                }

                if (payload?.subcultureInterval) {
                  updateData.subcultureInterval = payload.subcultureInterval;
                }
                break;
              }

              case 'DISCARD_CULTURE':
                updateData.cultureId = null;
                updateData.cultureDate = null;
                updateData.subcultureInterval = null;
                updateData.dueSubcultureDate = null;
                updateData.mediaId = null;
                updateData.parentId = null;
                metadataObj.reason = payload?.reason ?? 'unspecified';
                break;

              case 'DISCARD_CONTAINER':
                metadataObj.reason = payload?.reason ?? 'unspecified';
                break;

              case 'SUBCULTURE':
                // Source container goes EMPTY
                updateData.cultureId = null;
                updateData.mediaId = null;
                updateData.cultureDate = null;
                updateData.subcultureInterval = null;
                updateData.dueSubcultureDate = null;
                metadataObj.targetQrCodes = payload?.targetQrCodes ?? [];
                break;

              case 'EXIT_CULTURE':
                updateData.cultureId = null;
                updateData.mediaId = null;
                updateData.cultureDate = null;
                updateData.subcultureInterval = null;
                updateData.dueSubcultureDate = null;
                updateData.parentId = null;
                metadataObj.exitType = payload?.exitType ?? 'unspecified';
                break;

              case 'WASH':
                updateData.mediaId = null;
                updateData.cultureId = null;
                updateData.parentId = null;
                updateData.cultureDate = null;
                updateData.subcultureInterval = null;
                updateData.dueSubcultureDate = null;
                updateData.notes = null;
                break;
            }

            const previousStatus = container.status;

            // FK validation for PREPARE_MEDIA
            if (action === 'PREPARE_MEDIA' && payload?.mediaBatchId) {
              const batch = await tx.mediaBatch.findUnique({
                where: { id: payload.mediaBatchId },
              });
              if (!batch) {
                return {
                  error: `Media batch ${payload.mediaBatchId} not found`,
                };
              }
            }

            // FK validation for ADD_CULTURE
            if (action === 'ADD_CULTURE') {
              if (payload?.cultureTypeId) {
                const ct = await tx.cultureType.findUnique({
                  where: { id: payload.cultureTypeId },
                });
                if (!ct) {
                  return {
                    error: `Culture type ${payload.cultureTypeId} not found`,
                  };
                }
              }
              if (payload?.parentQr) {
                const parent = await tx.container.findUnique({
                  where: { qrCode: payload.parentQr },
                });
                if (!parent) {
                  return {
                    error: `Parent container ${payload.parentQr} not found`,
                  };
                }
              }
            }

            // Bug 2: SUBCULTURE target validation inside transaction
            if (action === 'SUBCULTURE') {
              const targetQrCodes = payload?.targetQrCodes ?? [];
              if (targetQrCodes.length === 0) {
                return {
                  error:
                    'SUBCULTURE requires at least one target QR code',
                };
              }
              const invalidTargets: string[] = [];
              for (const tqr of targetQrCodes) {
                const t = await tx.container.findUnique({
                  where: { qrCode: tqr },
                });
                if (!t) {
                  invalidTargets.push(`${tqr} not found`);
                } else if (t.status !== ContainerStatus.HAS_MEDIA) {
                  invalidTargets.push(
                    `${tqr} is ${t.status}, must be HAS_MEDIA`,
                  );
                }
              }
              if (invalidTargets.length > 0) {
                return {
                  error: `Invalid targets: ${invalidTargets.join(', ')}`,
                };
              }
            }

            const updatedContainer = await tx.container.update({
              where: { qrCode: qr },
              data: updateData,
            });

            await tx.actionLog.create({
              data: {
                action,
                performedBy: employeeId,
                containerQr: qr,
                previousStatus,
                newStatus: targetStatus,
                note: payload?.note ?? null,
                metadata: JSON.stringify(metadataObj),
              },
            });

            // For SUBCULTURE, link target containers to source as parent
            if (action === 'SUBCULTURE' && payload?.targetQrCodes?.length) {
              for (const targetQr of payload.targetQrCodes) {
                const target = await tx.container.findUnique({
                  where: { qrCode: targetQr },
                });
                if (target && target.status === ContainerStatus.HAS_MEDIA) {
                  await tx.container.update({
                    where: { qrCode: targetQr },
                    data: {
                      status: ContainerStatus.HAS_CULTURE,
                      cultureId: container.cultureId,
                      parentId: qr,
                      cultureDate: new Date(),
                      subcultureInterval:
                        container.subcultureInterval ?? DEFAULT_SUBCULTURE_INTERVAL,
                      dueSubcultureDate: (() => {
                        const d = new Date();
                        d.setDate(
                          d.getDate() +
                            (container.subcultureInterval ?? DEFAULT_SUBCULTURE_INTERVAL),
                        );
                        return d;
                      })(),
                    },
                  });

                  await tx.actionLog.create({
                    data: {
                      action: 'ADD_CULTURE',
                      performedBy: employeeId,
                      containerQr: targetQr,
                      previousStatus: target.status,
                      newStatus: ContainerStatus.HAS_CULTURE,
                      note: `Subcultured from ${qr}`,
                      metadata: JSON.stringify({
                        sourceQr: qr,
                        subcultured: true,
                      }),
                    },
                  });
                }
              }
            }

            return {
              error: null,
              qrCode: updatedContainer.qrCode,
              status: updatedContainer.status,
            };
          },
        );

        if (txResult.error !== null) {
          errors.push({ qrCode: qr, reason: txResult.error });
          continue;
        }

        results.push({ qrCode: txResult.qrCode, status: txResult.status });
      } catch (err) {
        // Bug 6: Log error with stack trace
        console.error('Batch action error for', qr, err);

        let reason = 'Unknown error';
        if (err instanceof PrismaClientKnownRequestError) {
          switch (err.code) {
            case 'P2002':
              reason =
                'Unique constraint violation: a record with this key already exists';
              break;
            case 'P2003':
              reason =
                'Foreign key constraint violation: referenced record not found';
              break;
            case 'P2025':
              reason =
                'Record not found: the record to update or delete does not exist';
              break;
            default:
              reason = `Database error (${err.code}): ${err.message}`;
          }
        } else if (err instanceof Error) {
          reason = err.message;
        }

        errors.push({ qrCode: qr, reason });
      }
    }

    return { results, errors };
  }

  /* ------------------------------------------------------------------ */
  /*  Dashboard statistics                                              */
  /* ------------------------------------------------------------------ */

  async getDashboardStats() {
    const [statusGroups, recentLogs, totalCount, overdueCultures] =
      await Promise.all([
        this.prisma.container.groupBy({
          by: ['status'],
          _count: { status: true },
        }),
        this.prisma.actionLog.findMany({
          take: 10,
          orderBy: { timestamp: 'desc' },
          include: { employee: true, container: true },
        }),
        this.prisma.container.count(),
        this.prisma.container.count({
          where: {
            status: ContainerStatus.HAS_CULTURE,
            dueSubcultureDate: { lt: new Date() },
          },
        }),
      ]);

    // Bug 9: Initialize with all ContainerStatus values set to 0
    const statusCounts: Record<string, number> = {};
    for (const status of Object.values(ContainerStatus)) {
      statusCounts[status] = 0;
    }
    for (const group of statusGroups) {
      statusCounts[group.status] = group._count.status;
    }

    return { statusCounts, recentLogs, totalCount, overdueCultures };
  }

  /* ------------------------------------------------------------------ */
  /*  Bulk register new containers                                      */
  /* ------------------------------------------------------------------ */

  async registerContainers(
    qrCodes: string[],
    containerTypeId?: string,
    notes?: string,
  ) {
    if (!qrCodes || qrCodes.length === 0) {
      throw new BadRequestException('qrCodes array must not be empty');
    }

    // Bug 8: Validate QR code format
    const invalidQrs = qrCodes.filter((qr) => !this.isValidQrCode(qr));
    if (invalidQrs.length > 0) {
      throw new BadRequestException(
        `Invalid QR code format: ${invalidQrs.join(', ')}`,
      );
    }

    let created = 0;
    const skipped: string[] = [];

    await this.prisma.$transaction(async (tx) => {
      for (const qr of qrCodes) {
        const existing = await tx.container.findUnique({
          where: { qrCode: qr },
        });
        if (!existing) {
          await tx.container.create({
            data: {
              qrCode: qr,
              status: ContainerStatus.EMPTY,
              containerTypeId: containerTypeId ?? null,
              notes: notes ?? null,
            },
          });
          created++;
        } else {
          skipped.push(qr);
        }
      }
    });

    return { created, skipped };
  }
}
