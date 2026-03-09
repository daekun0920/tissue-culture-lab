export const queryKeys = {
  containers: {
    all: ['containers'] as const,
    detail: (qr: string) => ['containers', qr] as const,
    lookup: (q: string) => ['containers', 'lookup', q] as const,
  },
  containerTypes: { all: ['container-types'] as const },
  dashboard: ['dashboard'] as const,
  mediaRecipes: {
    all: ['media-recipes'] as const,
    detail: (id: string) => ['media-recipes', id] as const,
  },
  mediaBatches: {
    all: ['media-batches'] as const,
    detail: (id: string) => ['media-batches', id] as const,
  },
  cultureTypes: { all: ['culture-types'] as const },
  employees: { all: ['employees'] as const },
  reports: {
    employee: (employeeId: string, from?: string, to?: string) =>
      ['reports', 'employee', employeeId, from, to] as const,
    system: (from?: string, to?: string) =>
      ['reports', 'system', from, to] as const,
  },
  experiments: {
    all: ['experiments'] as const,
    detail: (id: string) => ['experiments', id] as const,
    entries: (id: string) => ['experiments', id, 'entries'] as const,
  },
  locations: {
    zones: ['locations', 'zones'] as const,
    zone: (id: string) => ['locations', 'zones', id] as const,
    rack: (id: string) => ['locations', 'racks', id] as const,
    shelf: (id: string) => ['locations', 'shelves', id] as const,
  },
  pickList: {
    list: (date?: string) => ['pick-list', date] as const,
    summary: ['pick-list', 'summary'] as const,
  },
  actionLogs: {
    list: (params?: Record<string, unknown>) =>
      ['action-logs', params] as const,
  },
  qrManager: {
    summary: ['qr-manager', 'summary'] as const,
  },
  enhancedDashboard: ['enhanced-dashboard'] as const,
};
