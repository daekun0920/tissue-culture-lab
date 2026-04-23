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
  Zone,
  Rack,
  Shelf,
  PickListData,
  PickListSummary,
  EnhancedDashboard,
  QrSummary,
  PaginatedResponse,
} from '@/types';

// ─── Fetch wrapper ──────────────────────────────────────────────

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || res.statusText);
  }
  return res.json();
}

// ─── Container Types ────────────────────────────────────────────

export const containerTypeApi = {
  getAll: async (): Promise<ContainerType[]> => {
    return apiFetch<ContainerType[]>('/container-types');
  },

  getOne: async (id: string): Promise<ContainerType> => {
    return apiFetch<ContainerType>(`/container-types/${id}`);
  },

  create: async (d: Partial<ContainerType>): Promise<ContainerType> => {
    return apiFetch<ContainerType>('/container-types', {
      method: 'POST',
      body: JSON.stringify(d),
    });
  },

  update: async (
    id: string,
    d: Partial<ContainerType>,
  ): Promise<ContainerType> => {
    return apiFetch<ContainerType>(`/container-types/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(d),
    });
  },

  remove: async (id: string) => {
    await apiFetch(`/container-types/${id}`, { method: 'DELETE' });
  },
};

// ─── Media Recipes ──────────────────────────────────────────────

export const mediaRecipeApi = {
  getAll: async (): Promise<MediaRecipe[]> => {
    return apiFetch<MediaRecipe[]>('/media-recipes');
  },

  getOne: async (id: string): Promise<MediaRecipe> => {
    return apiFetch<MediaRecipe>(`/media-recipes/${id}`);
  },

  create: async (d: Partial<MediaRecipe>): Promise<MediaRecipe> => {
    return apiFetch<MediaRecipe>('/media-recipes', {
      method: 'POST',
      body: JSON.stringify(d),
    });
  },

  update: async (
    id: string,
    d: Partial<MediaRecipe>,
  ): Promise<MediaRecipe> => {
    return apiFetch<MediaRecipe>(`/media-recipes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(d),
    });
  },

  remove: async (id: string) => {
    await apiFetch(`/media-recipes/${id}`, { method: 'DELETE' });
  },
};

// ─── Media Batches ──────────────────────────────────────────────

export const mediaBatchApi = {
  getAll: async (): Promise<MediaBatch[]> => {
    return apiFetch<MediaBatch[]>('/media-batches');
  },

  getOne: async (id: string): Promise<MediaBatch> => {
    return apiFetch<MediaBatch>(`/media-batches/${id}`);
  },

  create: async (d: {
    recipeId: string;
    batchNumber?: string;
    notes?: string;
  }): Promise<MediaBatch> => {
    return apiFetch<MediaBatch>('/media-batches', {
      method: 'POST',
      body: JSON.stringify(d),
    });
  },

  remove: async (id: string) => {
    await apiFetch(`/media-batches/${id}`, { method: 'DELETE' });
  },
};

// ─── Culture Types ──────────────────────────────────────────────

export const cultureTypeApi = {
  getAll: async (): Promise<CultureType[]> => {
    return apiFetch<CultureType[]>('/culture-types');
  },

  create: async (d: Partial<CultureType>): Promise<CultureType> => {
    return apiFetch<CultureType>('/culture-types', {
      method: 'POST',
      body: JSON.stringify(d),
    });
  },

  update: async (
    id: string,
    d: Partial<CultureType>,
  ): Promise<CultureType> => {
    return apiFetch<CultureType>(`/culture-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(d),
    });
  },

  remove: async (id: string) => {
    await apiFetch(`/culture-types/${id}`, { method: 'DELETE' });
  },
};

// ─── Employees ──────────────────────────────────────────────────

export const employeeApi = {
  getAll: async (): Promise<Employee[]> => {
    return apiFetch<Employee[]>('/employees');
  },

  create: async (d: { name: string }): Promise<Employee> => {
    return apiFetch<Employee>('/employees', {
      method: 'POST',
      body: JSON.stringify(d),
    });
  },

  update: async (id: string, d: Partial<Employee>): Promise<Employee> => {
    return apiFetch<Employee>(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(d),
    });
  },

  remove: async (id: string) => {
    await apiFetch(`/employees/${id}`, { method: 'DELETE' });
  },
};

// ─── Action Logs ────────────────────────────────────────────────

export const actionLogApi = {
  getAll: async (params?: {
    containerQr?: string;
    action?: string;
    employeeId?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<ActionLog>> => {
    const searchParams = new URLSearchParams();
    if (params?.containerQr) searchParams.set('containerQr', params.containerQr);
    if (params?.action) searchParams.set('action', params.action);
    if (params?.employeeId) searchParams.set('employeeId', params.employeeId);
    if (params?.from) searchParams.set('from', params.from);
    if (params?.to) searchParams.set('to', params.to);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    return apiFetch<PaginatedResponse<ActionLog>>(`/action-logs${qs ? `?${qs}` : ''}`);
  },
};

// ─── Containers ─────────────────────────────────────────────────

export const containerApi = {
  getAll: async (status?: string): Promise<Container[]> => {
    const params = status
      ? `?status=${encodeURIComponent(status)}`
      : '';
    return apiFetch<Container[]>(`/containers${params}`);
  },

  getByQr: async (qr: string): Promise<Container> => {
    return apiFetch<Container>(
      `/containers/${encodeURIComponent(qr)}`,
    );
  },

  lookup: async (q: string): Promise<Container[]> => {
    return apiFetch<Container[]>(
      `/containers/lookup?q=${encodeURIComponent(q)}`,
    );
  },

  register: async (
    qrCodes: string[],
    containerTypeId?: string,
    notes?: string,
  ) => {
    const res = await apiFetch<{ created: number }>('/containers/register', {
      method: 'POST',
      body: JSON.stringify({ qrCodes, containerTypeId, notes }),
    });
    return { count: res.created };
  },

  batchAction: async (payload: BatchActionPayload) => {
    return apiFetch<{
      results: { qrCode: string; status: string }[];
      errors: { qrCode: string; reason: string }[];
    }>('/containers/batch-action', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getDashboard: async (): Promise<DashboardStats> => {
    return apiFetch<DashboardStats>('/containers/dashboard');
  },

  validateAction: async (
    action: string,
    qrCodes: string[],
  ): Promise<ValidationResult[]> => {
    const params = new URLSearchParams({
      action,
      qrCodes: qrCodes.join(','),
    });
    return apiFetch<ValidationResult[]>(
      `/containers/validate-action?${params}`,
    );
  },
};

// ─── Reports ────────────────────────────────────────────────────

export const reportsApi = {
  getEmployeeReport: async (
    employeeId: string,
    from?: string,
    to?: string,
  ): Promise<EmployeeReport> => {
    const params = new URLSearchParams({ employeeId });
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    return apiFetch<EmployeeReport>(`/reports/employee?${params}`);
  },

  getSystemReport: async (
    from?: string,
    to?: string,
  ): Promise<SystemReport> => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const qs = params.toString();
    return apiFetch<SystemReport>(`/reports/system${qs ? `?${qs}` : ''}`);
  },

  getContainerHistory: async (qr: string) => {
    return apiFetch<ActionLog[]>(
      `/reports/container-history/${encodeURIComponent(qr)}`,
    );
  },

  getEnhancedDashboard: async (): Promise<EnhancedDashboard> => {
    return apiFetch<EnhancedDashboard>('/reports/enhanced-dashboard');
  },
};

// ─── Locations ─────────────────────────────────────────────────

export const locationApi = {
  getZones: async (): Promise<Zone[]> => {
    return apiFetch<Zone[]>('/locations/zones');
  },

  getZone: async (id: string): Promise<Zone> => {
    return apiFetch<Zone>(`/locations/zones/${id}`);
  },

  createZone: async (d: { name: string }): Promise<Zone> => {
    return apiFetch<Zone>('/locations/zones', {
      method: 'POST',
      body: JSON.stringify(d),
    });
  },

  updateZone: async (id: string, d: { name?: string }): Promise<Zone> => {
    return apiFetch<Zone>(`/locations/zones/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(d),
    });
  },

  deleteZone: async (id: string) => {
    await apiFetch(`/locations/zones/${id}`, { method: 'DELETE' });
  },

  getRack: async (id: string): Promise<Rack> => {
    return apiFetch<Rack>(`/locations/racks/${id}`);
  },

  createRack: async (d: { name: string; zoneId: string }): Promise<Rack> => {
    return apiFetch<Rack>('/locations/racks', {
      method: 'POST',
      body: JSON.stringify(d),
    });
  },

  updateRack: async (id: string, d: { name?: string }): Promise<Rack> => {
    return apiFetch<Rack>(`/locations/racks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(d),
    });
  },

  deleteRack: async (id: string) => {
    await apiFetch(`/locations/racks/${id}`, { method: 'DELETE' });
  },

  getShelf: async (id: string): Promise<Shelf> => {
    return apiFetch<Shelf>(`/locations/shelves/${id}`);
  },

  createShelf: async (d: { name: string; rackId: string }): Promise<Shelf> => {
    return apiFetch<Shelf>('/locations/shelves', {
      method: 'POST',
      body: JSON.stringify(d),
    });
  },

  updateShelf: async (id: string, d: { name?: string }): Promise<Shelf> => {
    return apiFetch<Shelf>(`/locations/shelves/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(d),
    });
  },

  deleteShelf: async (id: string) => {
    await apiFetch(`/locations/shelves/${id}`, { method: 'DELETE' });
  },
};

// ─── Pick List ─────────────────────────────────────────────────

export const pickListApi = {
  getPickList: async (date?: string): Promise<PickListData> => {
    const params = date ? `?date=${encodeURIComponent(date)}` : '';
    return apiFetch<PickListData>(`/pick-list${params}`);
  },

  getSummary: async (): Promise<PickListSummary> => {
    return apiFetch<PickListSummary>('/pick-list/summary');
  },
};

// ─── QR Manager ────────────────────────────────────────────────

export const qrManagerApi = {
  getSummary: async (): Promise<QrSummary> => {
    return apiFetch<QrSummary>('/containers/qr-summary');
  },
};

// ─── Experiments ────────────────────────────────────────────────

export const experimentApi = {
  getAll: async (status?: string): Promise<Experiment[]> => {
    const params = status
      ? `?status=${encodeURIComponent(status)}`
      : '';
    return apiFetch<Experiment[]>(`/experiments${params}`);
  },

  getOne: async (id: string): Promise<Experiment> => {
    return apiFetch<Experiment>(`/experiments/${id}`);
  },

  create: async (d: {
    name: string;
    description?: string;
    createdBy: string;
  }): Promise<Experiment> => {
    return apiFetch<Experiment>('/experiments', {
      method: 'POST',
      body: JSON.stringify(d),
    });
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
    return apiFetch<Experiment>(`/experiments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(d),
    });
  },

  addCultures: async (
    id: string,
    d: { containerQrCodes: string[]; notes?: string },
  ) => {
    return apiFetch<{ count: number }>(`/experiments/${id}/cultures`, {
      method: 'POST',
      body: JSON.stringify(d),
    });
  },

  removeCulture: async (id: string, containerQr: string) => {
    await apiFetch(
      `/experiments/${id}/cultures/${encodeURIComponent(containerQr)}`,
      { method: 'DELETE' },
    );
  },

  addEntry: async (
    id: string,
    d: { entryType?: string; content: string; createdBy: string },
  ): Promise<ExperimentEntry> => {
    return apiFetch<ExperimentEntry>(`/experiments/${id}/entries`, {
      method: 'POST',
      body: JSON.stringify(d),
    });
  },

  getEntries: async (
    id: string,
    type?: string,
  ): Promise<ExperimentEntry[]> => {
    const params = type ? `?type=${encodeURIComponent(type)}` : '';
    return apiFetch<ExperimentEntry[]>(
      `/experiments/${id}/entries${params}`,
    );
  },
};
