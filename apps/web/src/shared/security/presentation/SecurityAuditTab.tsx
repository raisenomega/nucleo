import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@shared/i18n";
import { Pagination } from "@shared/components/Pagination";
import type { AuditEntry, ISecurityRepository } from "@shared/security/domain/security.types";
import { SeverityBadge } from "./SeverityBadge";
import { AuditDiffModal } from "./AuditDiffModal";
import { downloadAuditCsv } from "./security.csv";
import { fmtDate } from "./security.fmt";

const RISKS = ["", "low", "medium", "high", "critical"];

export function SecurityAuditTab({ repo }: { repo: ISecurityRepository }) {
  const { t } = useI18n();
  const [rows, setRows] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [risk, setRisk] = useState("");
  const [view, setView] = useState<AuditEntry | null>(null);

  const load = useCallback(async () => {
    const r = await repo.getAuditLog({ riskLevel: risk || undefined, limit: 20, offset: (page - 1) * 20 });
    setRows(r.rows); setTotal(r.total);
  }, [repo, risk, page]);
  useEffect(() => { void load(); }, [load]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select value={risk} onChange={(e) => { setPage(1); setRisk(e.target.value); }} className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm">
          {RISKS.map((r) => <option key={r} value={r}>{r || t("secAll")}</option>)}
        </select>
        <button type="button" onClick={() => downloadAuditCsv(rows)} className="rounded-lg bg-secondary px-3 py-1.5 text-sm font-bold">{t("secExportCsv")}</button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full font-body text-sm">
          <thead className="bg-secondary text-xs uppercase text-muted-foreground">
            <tr><th className="p-2 text-left">{t("date")}</th><th className="p-2 text-left">{t("secTenant")}</th><th className="p-2 text-left">{t("secUser")}</th><th className="p-2 text-left">{t("secAction")}</th><th className="p-2 text-left">{t("secEntity")}</th><th className="p-2 text-left">{t("secRisk")}</th><th className="p-2"></th></tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id} className="border-t border-border hover:bg-secondary">
                <td className="whitespace-nowrap p-2 text-xs">{fmtDate(a.createdAt)}</td>
                <td className="p-2">{a.tenantName ?? "—"}</td>
                <td className="p-2">{a.userName ?? "—"}</td>
                <td className="p-2 font-bold">{a.action}</td>
                <td className="p-2 text-muted-foreground">{a.entityType ?? "—"}</td>
                <td className="p-2"><SeverityBadge level={a.riskLevel} /></td>
                <td className="p-2"><button type="button" onClick={() => setView(a)} className="text-xs font-bold text-accent">{t("secViewChanges")}</button></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7} className="p-3 text-center text-sm text-muted-foreground">{t("noData")}</td></tr>}
          </tbody>
        </table>
      </div>
      <Pagination total={total} page={page} pageSize={20} onPageChange={setPage} />
      {view && <AuditDiffModal entry={view} onClose={() => setView(null)} />}
    </div>
  );
}
