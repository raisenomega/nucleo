import { supabase } from "@shared/lib/supabase";
import type {
  AuditEntry, AuditFilters, EventFilters, GuardianEvent, ISecurityRepository,
  IpWatchEntry, Paged, SecurityDashboardData, SentinelScan,
} from "@shared/security/domain/security.types";

// El RPC ya devuelve camelCase; casteamos y coercionamos números. Las listas ya vienen mapeadas.
export const supabaseSecurityRepository: ISecurityRepository = {
  async getDashboard(): Promise<SecurityDashboardData | null> {
    const { data, error } = await supabase.rpc("get_security_dashboard");
    if (error || !data) return null;
    const d = data as unknown as SecurityDashboardData;
    return { ...d, securityScore: Number(d.securityScore ?? 100) };
  },
  async getAuditLog(f: AuditFilters): Promise<Paged<AuditEntry>> {
    const { data } = await supabase.rpc("get_audit_log", { p_filters: f });
    const r = (data ?? { total: 0, rows: [] }) as unknown as Paged<AuditEntry>;
    return { total: Number(r.total ?? 0), rows: r.rows ?? [] };
  },
  async getGuardianEvents(f: EventFilters): Promise<Paged<GuardianEvent>> {
    const { data } = await supabase.rpc("get_guardian_events", { p_filters: f });
    const r = (data ?? { total: 0, rows: [] }) as unknown as Paged<GuardianEvent>;
    return { total: Number(r.total ?? 0), rows: r.rows ?? [] };
  },
  async listScans(): Promise<SentinelScan[]> {
    const { data } = await supabase
      .from("sentinel_scans")
      .select("id,scan_type,score,passed,issues_count,scanned_at")
      .order("scanned_at", { ascending: false })
      .limit(50);
    return (data ?? []).map((s) => ({
      id: s.id as string, scanType: s.scan_type as string, score: s.score as number | null,
      passed: s.passed as boolean, issuesCount: Number(s.issues_count ?? 0), scannedAt: s.scanned_at as string,
    }));
  },
  async resolveEvent(id: string, notes: string): Promise<boolean> {
    const { error } = await supabase.rpc("resolve_guardian_event", { p_id: id, p_notes: notes });
    return !error;
  },
  async manageIp(ip, action, listType, reason, expires): Promise<boolean> {
    const { error } = await supabase.rpc("manage_ip_watchlist", {
      p_ip: ip, p_action: action, p_list_type: listType ?? "block", p_reason: reason ?? null, p_expires: expires ?? null,
    });
    return !error;
  },
  async runScan(type: string): Promise<boolean> {
    const { error } = await supabase.rpc("run_sentinel_scan", { p_type: type });
    return !error;
  },
};

export type { IpWatchEntry };
