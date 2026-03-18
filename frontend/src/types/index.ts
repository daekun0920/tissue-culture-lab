export type ContainerStatus = 'EMPTY' | 'HAS_MEDIA' | 'HAS_CULTURE' | 'DISCARDED';

export type ActionType =
  | 'REGISTER_CONTAINER'
  | 'PREPARE_MEDIA'
  | 'ADD_CULTURE'
  | 'DISCARD_CULTURE'
  | 'DISCARD_CONTAINER'
  | 'SUBCULTURE'
  | 'EXIT_CULTURE'
  | 'WASH';

export interface ContainerType {
  id: string;
  name: string;
  size?: string | null;
  material?: string | null;
  isVented: boolean;
  isReusable: boolean;
  _count?: { containers: number };
}

export interface Container {
  qrCode: string;
  status: ContainerStatus;
  containerTypeId: string | null;
  mediaId: string | null;
  cultureId: string | null;
  parentId: string | null;
  shelfId: string | null;
  notes: string | null;
  cultureDate: string | null;
  subcultureInterval: number | null;
  dueSubcultureDate: string | null;
  createdAt: string;
  updatedAt: string;
  containerType?: ContainerType | null;
  media?: (MediaBatch & { recipe: MediaRecipe }) | null;
  culture?: CultureType | null;
  parent?: Container | null;
  children?: Container[];
  logs?: (ActionLog & { employee: Employee })[];
  shelf?: Shelf | null;
}

export interface MediaRecipe {
  id: string;
  name: string;
  baseType: string;
  phLevel: number;
  agar: number;
  hormones: string;
  batches?: MediaBatch[];
  _count?: { batches: number };
}

export interface MediaBatch {
  id: string;
  recipeId: string;
  batchNumber: string | null;
  datePrep: string;
  notes: string | null;
  recipe?: MediaRecipe;
  containers?: Container[];
  _count?: { containers: number };
}

export interface CultureType {
  id: string;
  name: string;
  species?: string | null;
  clone?: string | null;
  origin?: string | null;
  defaultSubcultureInterval: number;
  containers?: Container[];
  _count?: { containers: number };
}

export interface Employee {
  id: string;
  name: string;
  isActive: boolean;
  _count?: { logs: number };
}

export interface ActionLog {
  id: string;
  timestamp: string;
  action: string;
  performedBy: string;
  containerQr: string;
  previousStatus: string | null;
  newStatus: string | null;
  note: string | null;
  metadata: string | null;
  employee?: Employee;
  container?: Container;
}

export interface BatchActionPayload {
  qrCodes: string[];
  action: string;
  payload?: {
    containerTypeId?: string;
    mediaBatchId?: string;
    cultureTypeId?: string;
    subcultureInterval?: number;
    dueSubcultureDate?: string;
    reason?: string;
    parentQr?: string;
    targetQrCodes?: string[];
    exitType?: string;
    note?: string;
  };
  employeeId: string;
}

export interface DashboardStats {
  statusCounts: Record<string, number>;
  recentLogs: (ActionLog & { employee: Employee; container: Container })[];
  totalCount: number;
  overdueCultures: number;
}

export interface ScannedContainer {
  qrCode: string;
  container: Container | null;
  isValid: boolean;
  invalidReason?: string;
}

export interface ValidationResult {
  qrCode: string;
  valid: boolean;
  status: ContainerStatus | null;
  reason?: string;
}

// Reports
export interface EmployeeReport {
  employee: Employee | null;
  totalActions: number;
  containersProcessed: number;
  contaminationRate: number;
  actionBreakdown: { action: string; count: number }[];
  recentActions: ActionLog[];
}

export interface SystemReport {
  totalContainers: number;
  activeCultures: number;
  mediaBatchesUsed: number;
  statusCounts: Record<string, number>;
  discardRate: number;
  contaminationDiscards: number;
  subcultureCount: number;
  actionBreakdown: { action: string; count: number }[];
}

// Experiments
export interface Experiment {
  id: string;
  name: string;
  description?: string | null;
  status: 'active' | 'completed' | 'cancelled';
  startDate: string;
  endDate?: string | null;
  createdBy: string;
  creator: Employee;
  cultures?: ExperimentCulture[];
  entries?: ExperimentEntry[];
  _count?: { cultures: number; entries: number };
}

export interface ExperimentCulture {
  id: string;
  experimentId: string;
  containerQr: string;
  addedAt: string;
  notes?: string | null;
  container: Container;
}

export interface ExperimentEntry {
  id: string;
  experimentId: string;
  entryType: 'log' | 'observation' | 'result' | 'photo';
  content: string;
  createdBy: string;
  createdAt: string;
  creator: Employee;
}

// Locations
export interface Zone {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  racks?: Rack[];
  _count?: { racks: number; shelves: number; containers: number };
}

export interface Rack {
  id: string;
  name: string;
  zoneId: string;
  createdAt: string;
  updatedAt: string;
  zone?: Zone;
  shelves?: Shelf[];
  _count?: { shelves: number; containers: number };
}

export interface Shelf {
  id: string;
  name: string;
  rackId: string;
  createdAt: string;
  updatedAt: string;
  rack?: Rack & { zone?: Zone };
  containers?: Container[];
  _count?: { containers: number };
}

// Pick List
export interface PickListData {
  dueSoon: Container[];
  expired: Container[];
  completed: (ActionLog & { employee: Employee; container: Container })[];
}

export interface PickListSummary {
  dueSoonCount: number;
  expiredCount: number;
  completedCount: number;
  total: number;
}

// Enhanced Dashboard
export interface EnhancedDashboard {
  activeCultures: { count: number; change: number };
  dueThisWeek: { count: number; change: number };
  totalContainers: { count: number; change: number };
  discardRate: { rate: number; change: number };
  statusDistribution: { status: string; count: number; percentage: number }[];
  weeklyActivity: { day: string; processed: number; discarded: number }[];
  upcomingWorkload: { date: string; dueCount: number }[];
  alerts: string[];
}

// QR Manager
export interface QrSummary {
  active: number;
  generated: number;
  archived: number;
  containers: Container[];
}

// Paginated response
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
