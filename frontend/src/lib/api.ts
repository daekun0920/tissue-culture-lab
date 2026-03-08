import { supabase } from './supabase';
import type {
  Container,
  ContainerType,
  MediaRecipe,
  MediaBatch,
  CultureType,
  Employee,
  ActionLog,
  BatchActionPayload,
  DashboardStats,
  EmployeeReport,
  SystemReport,
  Experiment,
  ExperimentEntry,
  ValidationResult,
  ContainerStatus,
} from '@/types';

// ─── snake_case <-> camelCase helpers ───────────────────────────

function toSnake(str: string): string {
  return str.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`);
}

function toCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, l: string) => l.toUpperCase());
}

type AnyObj = Record<string, unknown>;

function mapKeys<T>(obj: unknown, fn: (k: string) => string): T {
  if (Array.isArray(obj)) return obj.map((item) => mapKeys(item, fn)) as T;
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj as AnyObj).map(([k, v]) => [
        fn(k),
        mapKeys(v, fn),
      ]),
    ) as T;
  }
  return obj as T;
}

function camelKeys<T>(obj: unknown): T {
  return mapKeys<T>(obj, toCamel);
}

function snakeKeys<T>(obj: unknown): T {
  return mapKeys<T>(obj, toSnake);
}

function throwOnError<T>(result: { data: T | null; error: unknown }): T {
  if (result.error) throw result.error;
  return result.data as T;
}

// ─── Container Types ────────────────────────────────────────────

export const containerTypeApi = {
  getAll: async (): Promise<ContainerType[]> => {
    const { data, error } = await supabase
      .from('container_types')
      .select('*, containers(count)')
      .order('name');
    if (error) throw error;
    return (data ?? []).map((row: AnyObj) => {
      const mapped = camelKeys<ContainerType>(row);
      const counts = row.containers as { count: number }[] | undefined;
      if (counts) mapped._count = { containers: counts[0]?.count ?? 0 };
      return mapped;
    });
  },

  getOne: async (id: string): Promise<ContainerType> => {
    const { data, error } = await supabase
      .from('container_types')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return camelKeys<ContainerType>(data);
  },

  create: async (d: Partial<ContainerType>): Promise<ContainerType> => {
    const row = snakeKeys<AnyObj>(d);
    delete row._count;
    const res = await supabase
      .from('container_types')
      .insert(row)
      .select()
      .single();
    return camelKeys<ContainerType>(throwOnError(res));
  },

  update: async (id: string, d: Partial<ContainerType>): Promise<ContainerType> => {
    const row = snakeKeys<AnyObj>(d);
    delete row._count;
    delete row.id;
    const res = await supabase
      .from('container_types')
      .update(row)
      .eq('id', id)
      .select()
      .single();
    return camelKeys<ContainerType>(throwOnError(res));
  },

  remove: async (id: string) => {
    const res = await supabase.from('container_types').delete().eq('id', id);
    if (res.error) throw res.error;
  },
};

// ─── Media Recipes ──────────────────────────────────────────────

export const mediaRecipeApi = {
  getAll: async (): Promise<MediaRecipe[]> => {
    const { data, error } = await supabase
      .from('media_recipes')
      .select('*, media_batches(count)')
      .order('name');
    if (error) throw error;
    return (data ?? []).map((row: AnyObj) => {
      const mapped = camelKeys<MediaRecipe>(row);
      const counts = row.media_batches as { count: number }[] | undefined;
      if (counts) mapped._count = { batches: counts[0]?.count ?? 0 };
      return mapped;
    });
  },

  getOne: async (id: string): Promise<MediaRecipe> => {
    const { data, error } = await supabase
      .from('media_recipes')
      .select('*, media_batches(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return camelKeys<MediaRecipe>(data);
  },

  create: async (d: Partial<MediaRecipe>): Promise<MediaRecipe> => {
    const row = snakeKeys<AnyObj>(d);
    delete row._count;
    delete row.batches;
    const res = await supabase
      .from('media_recipes')
      .insert(row)
      .select()
      .single();
    return camelKeys<MediaRecipe>(throwOnError(res));
  },

  update: async (id: string, d: Partial<MediaRecipe>): Promise<MediaRecipe> => {
    const row = snakeKeys<AnyObj>(d);
    delete row._count;
    delete row.batches;
    delete row.id;
    const res = await supabase
      .from('media_recipes')
      .update(row)
      .eq('id', id)
      .select()
      .single();
    return camelKeys<MediaRecipe>(throwOnError(res));
  },

  remove: async (id: string) => {
    const res = await supabase.from('media_recipes').delete().eq('id', id);
    if (res.error) throw res.error;
  },
};

// ─── Media Batches ──────────────────────────────────────────────

export const mediaBatchApi = {
  getAll: async (): Promise<MediaBatch[]> => {
    const { data, error } = await supabase
      .from('media_batches')
      .select('*, media_recipes(*), containers(count)')
      .order('date_prep', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row: AnyObj) => {
      const mapped = camelKeys<MediaBatch>(row);
      // fix nested relation key: media_recipes -> recipe
      if ((row as AnyObj).media_recipes) {
        mapped.recipe = camelKeys<MediaRecipe>((row as AnyObj).media_recipes);
      }
      const counts = row.containers as { count: number }[] | undefined;
      if (counts) mapped._count = { containers: counts[0]?.count ?? 0 };
      return mapped;
    });
  },

  getOne: async (id: string): Promise<MediaBatch> => {
    const { data, error } = await supabase
      .from('media_batches')
      .select('*, media_recipes(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    const mapped = camelKeys<MediaBatch>(data);
    if ((data as AnyObj).media_recipes) {
      mapped.recipe = camelKeys<MediaRecipe>((data as AnyObj).media_recipes);
    }
    return mapped;
  },

  create: async (d: {
    recipeId: string;
    batchNumber?: string;
    notes?: string;
  }): Promise<MediaBatch> => {
    const res = await supabase
      .from('media_batches')
      .insert({
        recipe_id: d.recipeId,
        batch_number: d.batchNumber ?? null,
        notes: d.notes ?? null,
      })
      .select('*, media_recipes(*)')
      .single();
    const data = throwOnError(res);
    const mapped = camelKeys<MediaBatch>(data);
    if ((data as AnyObj).media_recipes) {
      mapped.recipe = camelKeys<MediaRecipe>((data as AnyObj).media_recipes);
    }
    return mapped;
  },

  remove: async (id: string) => {
    const res = await supabase.from('media_batches').delete().eq('id', id);
    if (res.error) throw res.error;
  },
};

// ─── Culture Types ──────────────────────────────────────────────

export const cultureTypeApi = {
  getAll: async (): Promise<CultureType[]> => {
    const { data, error } = await supabase
      .from('culture_types')
      .select('*, containers(count)')
      .order('name');
    if (error) throw error;
    return (data ?? []).map((row: AnyObj) => {
      const mapped = camelKeys<CultureType>(row);
      const counts = row.containers as { count: number }[] | undefined;
      if (counts) mapped._count = { containers: counts[0]?.count ?? 0 };
      return mapped;
    });
  },

  create: async (d: Partial<CultureType>): Promise<CultureType> => {
    const row = snakeKeys<AnyObj>(d);
    delete row._count;
    delete row.containers;
    const res = await supabase
      .from('culture_types')
      .insert(row)
      .select()
      .single();
    return camelKeys<CultureType>(throwOnError(res));
  },

  update: async (id: string, d: Partial<CultureType>): Promise<CultureType> => {
    const row = snakeKeys<AnyObj>(d);
    delete row._count;
    delete row.containers;
    delete row.id;
    const res = await supabase
      .from('culture_types')
      .update(row)
      .eq('id', id)
      .select()
      .single();
    return camelKeys<CultureType>(throwOnError(res));
  },

  remove: async (id: string) => {
    const res = await supabase.from('culture_types').delete().eq('id', id);
    if (res.error) throw res.error;
  },
};

// ─── Employees ──────────────────────────────────────────────────

export const employeeApi = {
  getAll: async (): Promise<Employee[]> => {
    const { data, error } = await supabase
      .from('employees')
      .select('*, action_logs(count)')
      .order('name');
    if (error) throw error;
    return (data ?? []).map((row: AnyObj) => {
      const mapped = camelKeys<Employee>(row);
      const counts = row.action_logs as { count: number }[] | undefined;
      if (counts) mapped._count = { logs: counts[0]?.count ?? 0 };
      return mapped;
    });
  },

  create: async (d: { name: string }): Promise<Employee> => {
    const res = await supabase
      .from('employees')
      .insert({ name: d.name })
      .select()
      .single();
    return camelKeys<Employee>(throwOnError(res));
  },

  update: async (id: string, d: Partial<Employee>): Promise<Employee> => {
    const row = snakeKeys<AnyObj>(d);
    delete row._count;
    delete row.id;
    const res = await supabase
      .from('employees')
      .update(row)
      .eq('id', id)
      .select()
      .single();
    return camelKeys<Employee>(throwOnError(res));
  },

  remove: async (id: string) => {
    const res = await supabase.from('employees').delete().eq('id', id);
    if (res.error) throw res.error;
  },
};

// ─── Action Logs ────────────────────────────────────────────────

export const actionLogApi = {
  getAll: async (containerQr?: string): Promise<ActionLog[]> => {
    let query = supabase
      .from('action_logs')
      .select('*, employees(*)')
      .order('timestamp', { ascending: false });
    if (containerQr) query = query.eq('container_qr', containerQr);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((row: AnyObj) => {
      const mapped = camelKeys<ActionLog>(row);
      if ((row as AnyObj).employees) {
        mapped.employee = camelKeys<Employee>((row as AnyObj).employees);
      }
      return mapped;
    });
  },
};

// ─── Containers ─────────────────────────────────────────────────

const CONTAINER_SELECT = `
  *,
  container_types(*),
  media_batches(*, media_recipes(*)),
  culture_types(*),
  parent:containers!parent_id(qr_code, status)
`;

function mapContainer(row: AnyObj): Container {
  const mapped = camelKeys<Container>(row);
  if (row.container_types) {
    mapped.containerType = camelKeys<ContainerType>(row.container_types);
  }
  if (row.media_batches) {
    const mb = camelKeys<MediaBatch>(row.media_batches);
    if ((row.media_batches as AnyObj)?.media_recipes) {
      mb.recipe = camelKeys<MediaRecipe>(
        (row.media_batches as AnyObj).media_recipes,
      );
    }
    mapped.media = mb as MediaBatch & { recipe: MediaRecipe };
  }
  if (row.culture_types) {
    mapped.culture = camelKeys<CultureType>(row.culture_types);
  }
  if (row.parent) {
    mapped.parent = camelKeys<Container>(row.parent);
  }
  return mapped;
}

export const containerApi = {
  getAll: async (status?: string): Promise<Container[]> => {
    let query = supabase
      .from('containers')
      .select(CONTAINER_SELECT)
      .order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((row: AnyObj) => mapContainer(row));
  },

  getByQr: async (qr: string): Promise<Container> => {
    const { data, error } = await supabase
      .from('containers')
      .select(
        `${CONTAINER_SELECT},
        action_logs(*, employees(*))`,
      )
      .eq('qr_code', qr)
      .single();
    if (error) throw error;
    const mapped = mapContainer(data as AnyObj);
    if ((data as AnyObj).action_logs) {
      mapped.logs = ((data as AnyObj).action_logs as AnyObj[]).map((l) => {
        const log = camelKeys<ActionLog & { employee: Employee }>(l);
        if ((l as AnyObj).employees) {
          log.employee = camelKeys<Employee>((l as AnyObj).employees);
        }
        return log;
      });
    }
    // Fetch children
    const { data: children } = await supabase
      .from('containers')
      .select('qr_code, status, created_at')
      .eq('parent_id', qr);
    if (children) {
      mapped.children = children.map((c: AnyObj) => camelKeys<Container>(c));
    }
    return mapped;
  },

  lookup: async (q: string): Promise<Container[]> => {
    const { data, error } = await supabase
      .from('containers')
      .select(CONTAINER_SELECT)
      .ilike('qr_code', `%${q}%`)
      .limit(20);
    if (error) throw error;
    return (data ?? []).map((row: AnyObj) => mapContainer(row));
  },

  register: async (
    qrCodes: string[],
    containerTypeId?: string,
    notes?: string,
  ) => {
    const rows = qrCodes.map((qr) => ({
      qr_code: qr,
      status: 'EMPTY' as const,
      container_type_id: containerTypeId ?? null,
      notes: notes ?? null,
    }));
    const { error } = await supabase.from('containers').insert(rows);
    if (error) throw error;
    return { count: qrCodes.length };
  },

  batchAction: async (payload: BatchActionPayload) => {
    const { qrCodes, action, payload: p, employeeId } = payload;

    // Fetch current containers
    const { data: containers, error: fetchErr } = await supabase
      .from('containers')
      .select('*')
      .in('qr_code', qrCodes);
    if (fetchErr) throw fetchErr;

    const statusMap: Record<string, ContainerStatus> = {};
    for (const c of containers ?? []) {
      statusMap[c.qr_code as string] = c.status as ContainerStatus;
    }

    // Determine updates + logs based on action
    type ContainerUpdate = Record<string, unknown>;
    const updates: ContainerUpdate = {};
    const logEntries: AnyObj[] = [];

    switch (action) {
      case 'REGISTER_CONTAINER': {
        // Insert new containers
        const rows = qrCodes.map((qr) => ({
          qr_code: qr,
          status: 'EMPTY',
          container_type_id: p?.containerTypeId ?? null,
          notes: p?.note ?? null,
        }));
        const { error } = await supabase.from('containers').upsert(rows, {
          onConflict: 'qr_code',
        });
        if (error) throw error;
        for (const qr of qrCodes) {
          logEntries.push({
            action,
            performed_by: employeeId,
            container_qr: qr,
            previous_status: null,
            new_status: 'EMPTY',
            note: p?.note ?? null,
          });
        }
        break;
      }

      case 'PREPARE_MEDIA': {
        updates.status = 'HAS_MEDIA';
        updates.media_id = p?.mediaBatchId ?? null;
        for (const qr of qrCodes) {
          logEntries.push({
            action,
            performed_by: employeeId,
            container_qr: qr,
            previous_status: statusMap[qr] ?? null,
            new_status: 'HAS_MEDIA',
            note: p?.note ?? null,
          });
        }
        break;
      }

      case 'ADD_CULTURE': {
        updates.status = 'HAS_CULTURE';
        updates.culture_id = p?.cultureTypeId ?? null;
        updates.culture_date = new Date().toISOString();
        updates.subculture_interval = p?.subcultureInterval ?? null;
        if (p?.subcultureInterval) {
          const due = new Date();
          due.setDate(due.getDate() + p.subcultureInterval);
          updates.due_subculture_date = due.toISOString();
        }
        for (const qr of qrCodes) {
          logEntries.push({
            action,
            performed_by: employeeId,
            container_qr: qr,
            previous_status: statusMap[qr] ?? null,
            new_status: 'HAS_CULTURE',
            note: p?.note ?? null,
          });
        }
        break;
      }

      case 'SUBCULTURE': {
        // Create child containers from targetQrCodes
        if (p?.targetQrCodes?.length) {
          for (const parentQr of qrCodes) {
            const parentContainer = (containers ?? []).find(
              (c: AnyObj) => c.qr_code === parentQr,
            );
            const childRows = p.targetQrCodes.map((childQr: string) => ({
              qr_code: childQr,
              status: 'HAS_CULTURE',
              container_type_id: parentContainer?.container_type_id ?? null,
              media_id: parentContainer?.media_id ?? null,
              culture_id: parentContainer?.culture_id ?? null,
              parent_id: parentQr,
              culture_date: new Date().toISOString(),
              subculture_interval:
                p?.subcultureInterval ??
                parentContainer?.subculture_interval ??
                null,
              due_subculture_date: p?.subcultureInterval
                ? new Date(
                    Date.now() + p.subcultureInterval * 86400000,
                  ).toISOString()
                : parentContainer?.due_subculture_date ?? null,
            }));
            const { error } = await supabase.from('containers').insert(childRows);
            if (error) throw error;

            for (const childQr of p.targetQrCodes) {
              logEntries.push({
                action,
                performed_by: employeeId,
                container_qr: childQr,
                previous_status: null,
                new_status: 'HAS_CULTURE',
                note: p?.note ?? `Subcultured from ${parentQr}`,
                metadata: JSON.stringify({ parentQr }),
              });
            }
          }
        }
        // Update parent due date
        if (p?.subcultureInterval) {
          const due = new Date();
          due.setDate(due.getDate() + p.subcultureInterval);
          await supabase
            .from('containers')
            .update({
              due_subculture_date: due.toISOString(),
              subculture_interval: p.subcultureInterval,
            })
            .in('qr_code', qrCodes);
        }
        for (const qr of qrCodes) {
          logEntries.push({
            action: 'SUBCULTURE',
            performed_by: employeeId,
            container_qr: qr,
            previous_status: statusMap[qr] ?? null,
            new_status: statusMap[qr] ?? null,
            note: p?.note ?? null,
          });
        }
        break;
      }

      case 'DISCARD_CULTURE':
      case 'DISCARD_CONTAINER': {
        updates.status = 'DISCARDED';
        for (const qr of qrCodes) {
          logEntries.push({
            action,
            performed_by: employeeId,
            container_qr: qr,
            previous_status: statusMap[qr] ?? null,
            new_status: 'DISCARDED',
            note: p?.reason ?? p?.note ?? null,
          });
        }
        break;
      }

      case 'EXIT_CULTURE': {
        updates.status = 'EMPTY';
        updates.culture_id = null;
        updates.culture_date = null;
        updates.subculture_interval = null;
        updates.due_subculture_date = null;
        for (const qr of qrCodes) {
          logEntries.push({
            action,
            performed_by: employeeId,
            container_qr: qr,
            previous_status: statusMap[qr] ?? null,
            new_status: 'EMPTY',
            note: p?.note ?? null,
          });
        }
        break;
      }

      case 'WASH': {
        updates.status = 'EMPTY';
        updates.media_id = null;
        updates.culture_id = null;
        updates.culture_date = null;
        updates.subculture_interval = null;
        updates.due_subculture_date = null;
        updates.notes = null;
        for (const qr of qrCodes) {
          logEntries.push({
            action,
            performed_by: employeeId,
            container_qr: qr,
            previous_status: statusMap[qr] ?? null,
            new_status: 'EMPTY',
            note: p?.note ?? null,
          });
        }
        break;
      }
    }

    // Apply container updates (if not a register/subculture-only action)
    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString();
      const { error } = await supabase
        .from('containers')
        .update(updates)
        .in('qr_code', qrCodes);
      if (error) throw error;
    }

    // Insert action logs
    if (logEntries.length > 0) {
      const { error: logErr } = await supabase
        .from('action_logs')
        .insert(logEntries);
      if (logErr) throw logErr;
    }

    return { success: true, count: qrCodes.length };
  },

  getDashboard: async (): Promise<DashboardStats> => {
    // Fetch all containers to count by status
    const { data: containers, error: cErr } = await supabase
      .from('containers')
      .select('status');
    if (cErr) throw cErr;

    const statusCounts: Record<string, number> = {};
    let overdueCultures = 0;
    const now = new Date();
    for (const c of containers ?? []) {
      statusCounts[c.status as string] =
        (statusCounts[c.status as string] ?? 0) + 1;
    }

    // Count overdue
    const { count: overdueCount } = await supabase
      .from('containers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'HAS_CULTURE')
      .lt('due_subculture_date', now.toISOString())
      .not('due_subculture_date', 'is', null);
    overdueCultures = overdueCount ?? 0;

    // Recent logs
    const { data: logs, error: lErr } = await supabase
      .from('action_logs')
      .select('*, employees(*), containers(qr_code, status)')
      .order('timestamp', { ascending: false })
      .limit(20);
    if (lErr) throw lErr;

    const recentLogs = (logs ?? []).map((row: AnyObj) => {
      const mapped = camelKeys<
        ActionLog & { employee: Employee; container: Container }
      >(row);
      if ((row as AnyObj).employees)
        mapped.employee = camelKeys<Employee>((row as AnyObj).employees);
      if ((row as AnyObj).containers)
        mapped.container = camelKeys<Container>((row as AnyObj).containers);
      return mapped;
    });

    return {
      statusCounts,
      recentLogs,
      totalCount: (containers ?? []).length,
      overdueCultures,
    };
  },

  validateAction: async (
    action: string,
    qrCodes: string[],
  ): Promise<ValidationResult[]> => {
    const { data: containers, error } = await supabase
      .from('containers')
      .select('qr_code, status')
      .in('qr_code', qrCodes);
    if (error) throw error;

    const found = new Map(
      (containers ?? []).map((c: AnyObj) => [c.qr_code as string, c.status as ContainerStatus]),
    );

    const validTransitions: Record<string, ContainerStatus[]> = {
      REGISTER_CONTAINER: [],
      PREPARE_MEDIA: ['EMPTY'],
      ADD_CULTURE: ['HAS_MEDIA'],
      DISCARD_CULTURE: ['HAS_CULTURE'],
      DISCARD_CONTAINER: ['EMPTY', 'HAS_MEDIA', 'HAS_CULTURE'],
      SUBCULTURE: ['HAS_CULTURE'],
      EXIT_CULTURE: ['HAS_CULTURE'],
      WASH: ['EMPTY', 'HAS_MEDIA', 'DISCARDED'],
    };

    return qrCodes.map((qr) => {
      const status = found.get(qr) ?? null;
      if (action === 'REGISTER_CONTAINER') {
        return {
          qrCode: qr,
          valid: !found.has(qr),
          status,
          reason: found.has(qr) ? 'Container already exists' : undefined,
        };
      }
      if (!found.has(qr)) {
        return { qrCode: qr, valid: false, status: null, reason: 'Not found' };
      }
      const allowed = validTransitions[action] ?? [];
      const valid = allowed.includes(status!);
      return {
        qrCode: qr,
        valid,
        status,
        reason: valid
          ? undefined
          : `Cannot ${action} on container with status ${status}`,
      };
    });
  },
};

// ─── Reports ────────────────────────────────────────────────────

export const reportsApi = {
  getEmployeeReport: async (
    employeeId: string,
    from?: string,
    to?: string,
  ): Promise<EmployeeReport> => {
    // Get employee
    const { data: emp } = await supabase
      .from('employees')
      .select('*')
      .eq('id', employeeId)
      .single();

    // Get logs
    let query = supabase
      .from('action_logs')
      .select('*')
      .eq('performed_by', employeeId)
      .order('timestamp', { ascending: false });
    if (from) query = query.gte('timestamp', from);
    if (to) query = query.lte('timestamp', to);
    const { data: logs } = await query;

    const allLogs = (logs ?? []).map((l: AnyObj) => camelKeys<ActionLog>(l));
    const uniqueContainers = new Set(allLogs.map((l) => l.containerQr));

    // Action breakdown
    const breakdown: Record<string, number> = {};
    let discards = 0;
    for (const l of allLogs) {
      breakdown[l.action] = (breakdown[l.action] ?? 0) + 1;
      if (
        l.action === 'DISCARD_CULTURE' ||
        l.action === 'DISCARD_CONTAINER'
      )
        discards++;
    }

    return {
      employee: emp ? camelKeys<Employee>(emp) : null,
      totalActions: allLogs.length,
      containersProcessed: uniqueContainers.size,
      contaminationRate:
        allLogs.length > 0 ? discards / allLogs.length : 0,
      actionBreakdown: Object.entries(breakdown).map(([action, count]) => ({
        action,
        count,
      })),
      recentActions: allLogs.slice(0, 20),
    };
  },

  getSystemReport: async (
    from?: string,
    to?: string,
  ): Promise<SystemReport> => {
    // Containers
    const { data: containers } = await supabase
      .from('containers')
      .select('status');
    const statusCounts: Record<string, number> = {};
    for (const c of containers ?? []) {
      const s = c.status as string;
      statusCounts[s] = (statusCounts[s] ?? 0) + 1;
    }

    // Logs
    let query = supabase
      .from('action_logs')
      .select('*')
      .order('timestamp', { ascending: false });
    if (from) query = query.gte('timestamp', from);
    if (to) query = query.lte('timestamp', to);
    const { data: logs } = await query;

    const allLogs = logs ?? [];
    const breakdown: Record<string, number> = {};
    let discards = 0;
    let contamination = 0;
    let subcultures = 0;

    for (const l of allLogs) {
      const a = l.action as string;
      breakdown[a] = (breakdown[a] ?? 0) + 1;
      if (a === 'DISCARD_CULTURE' || a === 'DISCARD_CONTAINER') discards++;
      if (
        a === 'DISCARD_CULTURE' &&
        ((l.note as string) ?? '').toLowerCase().includes('contam')
      )
        contamination++;
      if (a === 'SUBCULTURE') subcultures++;
    }

    const { count: batchCount } = await supabase
      .from('media_batches')
      .select('*', { count: 'exact', head: true });

    const total = (containers ?? []).length;

    return {
      totalContainers: total,
      activeCultures: statusCounts['HAS_CULTURE'] ?? 0,
      mediaBatchesUsed: batchCount ?? 0,
      statusCounts,
      discardRate: total > 0 ? discards / total : 0,
      contaminationDiscards: contamination,
      subcultureCount: subcultures,
      actionBreakdown: Object.entries(breakdown).map(([action, count]) => ({
        action,
        count,
      })),
    };
  },

  getContainerHistory: async (qr: string) => {
    const { data, error } = await supabase
      .from('action_logs')
      .select('*, employees(*)')
      .eq('container_qr', qr)
      .order('timestamp', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row: AnyObj) => {
      const mapped = camelKeys<ActionLog>(row);
      if ((row as AnyObj).employees)
        mapped.employee = camelKeys<Employee>((row as AnyObj).employees);
      return mapped;
    });
  },
};

// ─── Experiments ────────────────────────────────────────────────

export const experimentApi = {
  getAll: async (status?: string): Promise<Experiment[]> => {
    let query = supabase
      .from('experiments')
      .select(
        '*, employees!created_by(*), experiment_cultures(count), experiment_entries(count)',
      )
      .order('start_date', { ascending: false });
    if (status) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((row: AnyObj) => {
      const mapped = camelKeys<Experiment>(row);
      if ((row as AnyObj).employees) {
        mapped.creator = camelKeys<Employee>((row as AnyObj).employees);
      }
      const cultureCounts = row.experiment_cultures as
        | { count: number }[]
        | undefined;
      const entryCounts = row.experiment_entries as
        | { count: number }[]
        | undefined;
      mapped._count = {
        cultures: cultureCounts?.[0]?.count ?? 0,
        entries: entryCounts?.[0]?.count ?? 0,
      };
      return mapped;
    });
  },

  getOne: async (id: string): Promise<Experiment> => {
    const { data, error } = await supabase
      .from('experiments')
      .select(
        `*, employees!created_by(*),
        experiment_cultures(*, containers(*, container_types(*), culture_types(*))),
        experiment_entries(*, employees!created_by(*))`,
      )
      .eq('id', id)
      .single();
    if (error) throw error;

    const mapped = camelKeys<Experiment>(data);
    if ((data as AnyObj).employees) {
      mapped.creator = camelKeys<Employee>((data as AnyObj).employees);
    }
    if ((data as AnyObj).experiment_cultures) {
      mapped.cultures = (
        (data as AnyObj).experiment_cultures as AnyObj[]
      ).map((ec) => {
        const culture = camelKeys<
          Experiment['cultures'] extends (infer U)[] | undefined ? U : never
        >(ec);
        if ((ec as AnyObj).containers) {
          (culture as unknown as AnyObj).container = mapContainer(
            (ec as AnyObj).containers as AnyObj,
          );
        }
        return culture;
      }) as Experiment['cultures'];
    }
    if ((data as AnyObj).experiment_entries) {
      mapped.entries = (
        (data as AnyObj).experiment_entries as AnyObj[]
      ).map((ee) => {
        const entry = camelKeys<ExperimentEntry>(ee);
        if ((ee as AnyObj).employees) {
          entry.creator = camelKeys<Employee>((ee as AnyObj).employees);
        }
        return entry;
      });
    }
    return mapped;
  },

  create: async (d: {
    name: string;
    description?: string;
    createdBy: string;
  }): Promise<Experiment> => {
    const res = await supabase
      .from('experiments')
      .insert({
        name: d.name,
        description: d.description ?? null,
        created_by: d.createdBy,
      })
      .select('*, employees!created_by(*)')
      .single();
    const data = throwOnError(res);
    const mapped = camelKeys<Experiment>(data);
    if ((data as AnyObj).employees) {
      mapped.creator = camelKeys<Employee>((data as AnyObj).employees);
    }
    return mapped;
  },

  update: async (
    id: string,
    d: {
      name?: string;
      description?: string;
      status?: string;
      endDate?: string;
    },
  ): Promise<Experiment> => {
    const row: AnyObj = {};
    if (d.name !== undefined) row.name = d.name;
    if (d.description !== undefined) row.description = d.description;
    if (d.status !== undefined) row.status = d.status;
    if (d.endDate !== undefined) row.end_date = d.endDate;
    const res = await supabase
      .from('experiments')
      .update(row)
      .eq('id', id)
      .select('*, employees!created_by(*)')
      .single();
    const data = throwOnError(res);
    const mapped = camelKeys<Experiment>(data);
    if ((data as AnyObj).employees) {
      mapped.creator = camelKeys<Employee>((data as AnyObj).employees);
    }
    return mapped;
  },

  addCultures: async (
    id: string,
    d: { containerQrCodes: string[]; notes?: string },
  ) => {
    const rows = d.containerQrCodes.map((qr) => ({
      experiment_id: id,
      container_qr: qr,
      notes: d.notes ?? null,
    }));
    const { error } = await supabase.from('experiment_cultures').insert(rows);
    if (error) throw error;
    return { count: rows.length };
  },

  removeCulture: async (id: string, containerQr: string) => {
    const { error } = await supabase
      .from('experiment_cultures')
      .delete()
      .eq('experiment_id', id)
      .eq('container_qr', containerQr);
    if (error) throw error;
  },

  addEntry: async (
    id: string,
    d: { entryType?: string; content: string; createdBy: string },
  ): Promise<ExperimentEntry> => {
    const res = await supabase
      .from('experiment_entries')
      .insert({
        experiment_id: id,
        entry_type: d.entryType ?? 'log',
        content: d.content,
        created_by: d.createdBy,
      })
      .select('*, employees!created_by(*)')
      .single();
    const data = throwOnError(res);
    const mapped = camelKeys<ExperimentEntry>(data);
    if ((data as AnyObj).employees) {
      mapped.creator = camelKeys<Employee>((data as AnyObj).employees);
    }
    return mapped;
  },

  getEntries: async (id: string, type?: string): Promise<ExperimentEntry[]> => {
    let query = supabase
      .from('experiment_entries')
      .select('*, employees!created_by(*)')
      .eq('experiment_id', id)
      .order('created_at', { ascending: false });
    if (type) query = query.eq('entry_type', type);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((row: AnyObj) => {
      const mapped = camelKeys<ExperimentEntry>(row);
      if ((row as AnyObj).employees) {
        mapped.creator = camelKeys<Employee>((row as AnyObj).employees);
      }
      return mapped;
    });
  },
};
