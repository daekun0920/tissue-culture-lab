import axios from 'axios';
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
} from '@/types';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
});

export const containerApi = {
  getAll: (status?: string) =>
    api
      .get<Container[]>('/containers', { params: status ? { status } : {} })
      .then((r) => r.data),
  getByQr: (qr: string) =>
    api.get<Container>(`/containers/${qr}`).then((r) => r.data),
  lookup: (q: string) =>
    api
      .get<Container[]>('/containers/lookup', { params: { q } })
      .then((r) => r.data),
  batchAction: (payload: BatchActionPayload) =>
    api.post('/containers/batch-action', payload).then((r) => r.data),
  register: (qrCodes: string[], containerTypeId?: string, notes?: string) =>
    api
      .post('/containers/register', { qrCodes, containerTypeId, notes })
      .then((r) => r.data),
  getDashboard: () =>
    api.get<DashboardStats>('/containers/dashboard').then((r) => r.data),
  validateAction: (action: string, qrCodes: string[]) =>
    api
      .get('/containers/validate-action', {
        params: { action, qrCodes: qrCodes.join(',') },
      })
      .then((r) => r.data),
};

export const containerTypeApi = {
  getAll: () =>
    api.get<ContainerType[]>('/container-types').then((r) => r.data),
  getOne: (id: string) =>
    api.get<ContainerType>(`/container-types/${id}`).then((r) => r.data),
  create: (data: Partial<ContainerType>) =>
    api.post<ContainerType>('/container-types', data).then((r) => r.data),
  update: (id: string, data: Partial<ContainerType>) =>
    api
      .patch<ContainerType>(`/container-types/${id}`, data)
      .then((r) => r.data),
  remove: (id: string) => api.delete(`/container-types/${id}`),
};

export const mediaRecipeApi = {
  getAll: () =>
    api.get<MediaRecipe[]>('/media-recipes').then((r) => r.data),
  getOne: (id: string) =>
    api.get<MediaRecipe>(`/media-recipes/${id}`).then((r) => r.data),
  create: (data: Partial<MediaRecipe>) =>
    api.post<MediaRecipe>('/media-recipes', data).then((r) => r.data),
  update: (id: string, data: Partial<MediaRecipe>) =>
    api.put<MediaRecipe>(`/media-recipes/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/media-recipes/${id}`),
};

export const mediaBatchApi = {
  getAll: () =>
    api.get<MediaBatch[]>('/media-batches').then((r) => r.data),
  getOne: (id: string) =>
    api.get<MediaBatch>(`/media-batches/${id}`).then((r) => r.data),
  create: (data: { recipeId: string; batchNumber?: string; notes?: string }) =>
    api.post<MediaBatch>('/media-batches', data).then((r) => r.data),
  remove: (id: string) => api.delete(`/media-batches/${id}`),
};

export const cultureTypeApi = {
  getAll: () =>
    api.get<CultureType[]>('/culture-types').then((r) => r.data),
  create: (data: Partial<CultureType>) =>
    api.post<CultureType>('/culture-types', data).then((r) => r.data),
  update: (id: string, data: Partial<CultureType>) =>
    api.put<CultureType>(`/culture-types/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/culture-types/${id}`),
};

export const employeeApi = {
  getAll: () =>
    api.get<Employee[]>('/employees').then((r) => r.data),
  create: (data: { name: string }) =>
    api.post<Employee>('/employees', data).then((r) => r.data),
  update: (id: string, data: Partial<Employee>) =>
    api.put<Employee>(`/employees/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/employees/${id}`),
};

export const actionLogApi = {
  getAll: (containerQr?: string) =>
    api
      .get<ActionLog[]>('/action-logs', {
        params: containerQr ? { containerQr } : {},
      })
      .then((r) => r.data),
};

export const reportsApi = {
  getEmployeeReport: (employeeId: string, from?: string, to?: string) =>
    api
      .get<EmployeeReport>('/reports/employee', {
        params: { employeeId, from, to },
      })
      .then((r) => r.data),
  getSystemReport: (from?: string, to?: string) =>
    api
      .get<SystemReport>('/reports/system', { params: { from, to } })
      .then((r) => r.data),
  getContainerHistory: (qr: string) =>
    api.get(`/reports/container-history/${qr}`).then((r) => r.data),
};

export const experimentApi = {
  getAll: (status?: string) =>
    api
      .get<Experiment[]>('/experiments', {
        params: status ? { status } : {},
      })
      .then((r) => r.data),
  getOne: (id: string) =>
    api.get<Experiment>(`/experiments/${id}`).then((r) => r.data),
  create: (data: { name: string; description?: string; createdBy: string }) =>
    api.post<Experiment>('/experiments', data).then((r) => r.data),
  update: (
    id: string,
    data: {
      name?: string;
      description?: string;
      status?: string;
      endDate?: string;
    },
  ) => api.patch<Experiment>(`/experiments/${id}`, data).then((r) => r.data),
  addCultures: (
    id: string,
    data: { containerQrCodes: string[]; notes?: string },
  ) => api.post(`/experiments/${id}/cultures`, data).then((r) => r.data),
  removeCulture: (id: string, containerQr: string) =>
    api.delete(`/experiments/${id}/cultures/${containerQr}`),
  addEntry: (
    id: string,
    data: { entryType?: string; content: string; createdBy: string },
  ) =>
    api
      .post<ExperimentEntry>(`/experiments/${id}/entries`, data)
      .then((r) => r.data),
  getEntries: (id: string, type?: string) =>
    api
      .get<ExperimentEntry[]>(`/experiments/${id}/entries`, {
        params: type ? { type } : {},
      })
      .then((r) => r.data),
};

export default api;
