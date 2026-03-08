import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ContainerStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BatchActionDto } from './dto/batch-action.dto';
import {
  getTargetStatus,
  getValidActions,
  isValidForAction,
  ALL_ACTIONS,
} from './container-state-machine';

@Injectable()
export class ContainersService {
  constructor(private readonly prisma: PrismaService) {}

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
      DISCARD_CULTURE: 'HAS_CULTURE or HAS_MEDIA',
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

        const container = await this.prisma.container.findUnique({
          where: { qrCode: qr },
          include: { culture: true },
        });

        if (!container) {
          errors.push({ qrCode: qr, reason: 'Container not found' });
          continue;
        }

        if (!isValidForAction(container.status, action)) {
          errors.push({
            qrCode: qr,
            reason: `Cannot perform ${action} on container with status ${container.status}. Valid actions: ${getValidActions(container.status).join(', ')}`,
          });
          continue;
        }

        // Build the update data depending on the action
        const updateData: Record<string, unknown> = { status: targetStatus };
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
                28;
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
            // Keep mediaId if going from HAS_MEDIA
            if (container.status === ContainerStatus.HAS_CULTURE) {
              updateData.mediaId = null;
            }
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

        const updated = await this.prisma.$transaction(async (tx) => {
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
                    subcultureInterval: container.subcultureInterval ?? 28,
                    dueSubcultureDate: (() => {
                      const d = new Date();
                      d.setDate(
                        d.getDate() + (container.subcultureInterval ?? 28),
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

          return updatedContainer;
        });

        results.push({ qrCode: updated.qrCode, status: updated.status });
      } catch (err) {
        errors.push({
          qrCode: qr,
          reason: err instanceof Error ? err.message : 'Unknown error',
        });
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

    const statusCounts = statusGroups.reduce(
      (acc, group) => {
        acc[group.status] = group._count.status;
        return acc;
      },
      {} as Record<string, number>,
    );

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

    let created = 0;

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
        }
      }
    });

    return { created };
  }
}
