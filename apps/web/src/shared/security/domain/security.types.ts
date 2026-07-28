// BC seguridad (S6) — tipos de dominio del dashboard /security. Puro.
export interface GuardianEvent {
  readonly id: string;
  readonly tenantId: string | null;
  readonly userId: string | null;
  readonly userName: string | null;
  readonly eventType: string;
  readonly severity: "info" | "warning" | "high" | "critical";
  readonly ipAddress: string | null;
  readonly userAgent: string | null;
  readonly metadata: Record<string, unknown>;
  readonly resolved: boolean;
  readonly createdAt: string;
}
export interface AuditEntry {
  readonly id: string;
  readonly tenantId: string | null;
  readonly tenantName: string | null;
  readonly userId: string | null;
  readonly userName: string | null;
  readonly action: string;
  readonly entityType: string | null;
  readonly entityId: string | null;
  readonly riskLevel: "low" | "medium" | "high" | "critical";
  readonly oldValues: Record<string, unknown> | null;
  readonly newValues: Record<string, unknown> | null;
  readonly createdAt: string;
}
export interface IpWatchEntry {
  readonly id: string;
  readonly ipAddress: string;
  readonly listType: "block" | "allow" | "watch";
  readonly reason: string | null;
  readonly hits: number;
  readonly expiresAt: string | null;
  readonly createdAt: string;
}
export interface SentinelScan {
  readonly id: string;
  readonly scanType: string;
  readonly score: number | null;
  readonly passed: boolean;
  readonly issuesCount: number;
  readonly scannedAt: string;
}
export interface SecurityDashboardData {
  readonly loginsToday: number; readonly failedLoginsToday: number; readonly bruteForceAttempts: number;
  readonly criticalEvents: number; readonly blockedIps: number; readonly securityScore: number;
  readonly lastRlsAudit: SentinelScan | null; readonly lastGlIntegrity: SentinelScan | null;
  readonly recentEvents: GuardianEvent[]; readonly recentAudit: AuditEntry[]; readonly activeWatchlist: IpWatchEntry[];
}
export interface HermesCheckpoint {
  readonly id: string; readonly checkpointType: string; readonly changesCount: number; readonly createdAt: string;
  readonly tableCount: number | null; readonly functionCount: number | null; readonly triggerCount: number | null;
  readonly cronCount: number | null; readonly migrationCount: number | null; readonly rlsPolicyCount: number | null;
}
export interface AuditFilters { tenantId?: string; userId?: string; entityType?: string; action?: string; riskLevel?: string; from?: string; to?: string; limit?: number; offset?: number; }
export interface EventFilters { severity?: string; eventType?: string; unresolvedOnly?: boolean; limit?: number; offset?: number; }
export interface Paged<T> { total: number; rows: T[]; }
export interface ISecurityRepository {
  getDashboard(): Promise<SecurityDashboardData | null>;
  getAuditLog(f: AuditFilters): Promise<Paged<AuditEntry>>;
  getGuardianEvents(f: EventFilters): Promise<Paged<GuardianEvent>>;
  listScans(): Promise<SentinelScan[]>;
  listCheckpoints(): Promise<HermesCheckpoint[]>;
  createCheckpoint(notes: string | null): Promise<boolean>;
  resolveEvent(id: string, notes: string): Promise<boolean>;
  manageIp(ip: string, action: "add" | "remove", listType?: string, reason?: string, expires?: string | null): Promise<boolean>;
  runScan(type: string): Promise<boolean>;
}
