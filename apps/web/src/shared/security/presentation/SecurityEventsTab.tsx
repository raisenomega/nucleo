import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@shared/i18n";
import { Pagination } from "@shared/components/Pagination";
import type { GuardianEvent, ISecurityRepository } from "@shared/security/domain/security.types";
import { EventRow } from "./EventRow";
import { ResolveEventModal } from "./ResolveEventModal";

const SEVS = ["", "critical", "high", "warning", "info"];

export function SecurityEventsTab({ repo, onChange }: { repo: ISecurityRepository; onChange: () => void }) {
  const { t } = useI18n();
  const [rows, setRows] = useState<GuardianEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sev, setSev] = useState("");
  const [unresolved, setUnresolved] = useState(true);
  const [resolve, setResolve] = useState<GuardianEvent | null>(null);

  const load = useCallback(async () => {
    const r = await repo.getGuardianEvents({ severity: sev || undefined, unresolvedOnly: unresolved, limit: 20, offset: (page - 1) * 20 });
    setRows(r.rows); setTotal(r.total);
  }, [repo, sev, unresolved, page]);
  useEffect(() => { void load(); }, [load]);

  const block = async (e: GuardianEvent) => { if (e.ipAddress) { await repo.manageIp(e.ipAddress, "add", "block", `Manual: ${e.eventType}`, null); onChange(); } };
  const afterResolve = () => { setResolve(null); void load(); onChange(); };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select value={sev} onChange={(e) => { setPage(1); setSev(e.target.value); }} className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm">
          {SEVS.map((s) => <option key={s} value={s}>{s || t("secAll")}</option>)}
        </select>
        <label className="flex items-center gap-1 text-sm text-muted-foreground">
          <input type="checkbox" checked={unresolved} onChange={(e) => { setPage(1); setUnresolved(e.target.checked); }} /> {t("secUnresolvedOnly")}
        </label>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full font-body text-sm">
          <thead className="bg-secondary text-xs uppercase text-muted-foreground">
            <tr><th className="p-2 text-left">{t("date")}</th><th className="p-2 text-left">{t("secEventType")}</th><th className="p-2 text-left">{t("secSeverity")}</th><th className="p-2 text-left">{t("secUser")}</th><th className="p-2 text-left">{t("secIp")}</th><th className="p-2 text-left">{t("secResolved")}</th><th className="p-2"></th></tr>
          </thead>
          <tbody>
            {rows.map((e) => <EventRow key={e.id} e={e} onResolve={setResolve} onBlock={(x) => void block(x)} />)}
            {rows.length === 0 && <tr><td colSpan={7} className="p-3 text-center text-sm text-muted-foreground">{t("secNoEvents")}</td></tr>}
          </tbody>
        </table>
      </div>
      <Pagination total={total} page={page} pageSize={20} onPageChange={setPage} />
      {resolve && <ResolveEventModal event={resolve} repo={repo} onClose={() => setResolve(null)} onDone={afterResolve} />}
    </div>
  );
}
