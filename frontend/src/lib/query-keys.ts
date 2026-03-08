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
};
