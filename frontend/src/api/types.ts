export interface ApiResponse<T> {
  ok: boolean;
  data: T;
  error: string | null;
}

export interface SearchResult {
  appid: number;
  name: string;
}

export interface Game {
  id: number;
  steamAppId: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Watch {
  id: number;
  gameId: number;
  game: Game;
  enabled: boolean;
  discountThreshold: number;
  priceThresholdEnabled: boolean;
  priceThresholdCents: number | null;
  createdAt: string;
  updatedAt: string;
  notifications?: Notification[];
}

export interface PriceSnapshot {
  id: number;
  gameId: number;
  currency: string;
  finalCents: number;
  initialCents: number;
  discountPercent: number;
  isFree: boolean;
  status: string;
  fetchedAt: string;
}

export interface Notification {
  id: number;
  watchId: number;
  watch?: Watch;
  type: 'PRICE_BELOW' | 'DISCOUNT_REACHED' | 'ERROR';
  message: string;
  readAt: string | null;
  createdAt: string;
}

export interface JobRun {
  id: number;
  jobName: string;
  startedAt: string;
  finishedAt: string | null;
  status: string;
  error: string | null;
  statsJson: string | null;
}

export interface AuditLog {
  id: number;
  action: string;
  metaJson: string;
  ip: string | null;
  createdAt: string;
}

export interface AdminOverview {
  recentJobRuns: JobRun[];
  recentErrors: Notification[];
  recentAuditLogs: AuditLog[];
}
