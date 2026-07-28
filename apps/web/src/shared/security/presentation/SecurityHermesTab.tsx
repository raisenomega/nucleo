import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@shared/i18n";
import type { HermesCheckpoint, ISecurityRepository } from "@shared/security/domain/security.types";
import { fmtDate } from "./security.fmt";

export function SecurityHermesTab({ repo }: { repo: ISecurityRepository }) {
  const { t } = useI18n();
  const [rows, setRows] = useState<HermesCheckpoint[]>([]);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => { setRows(await repo.listCheckpoints()); }, [repo]);
  useEffect(() => { void load(); }, [load]);
  const create = async () => { setBusy(true); await repo.createCheckpoint(null); setBusy(false); void load(); };
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{t("hermHint")}</p>
      <button type="button" disabled={busy} onClick={() => void create()}
        className="rounded-lg bg-primary px-3 py-1.5 text-sm font-bold text-primary-foreground disabled:opacity-50">
        {busy ? t("secRunning") : t("hermCreate")}
      </button>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full font-body text-sm">
          <thead className="bg-secondary text-xs uppercase text-muted-foreground">
            <tr><th className="p-2 text-left">{t("secScannedAt")}</th><th className="p-2 text-left">{t("secScanType")}</th><th className="p-2 text-left">{t("hermTables")}</th><th className="p-2 text-left">{t("hermFunctions")}</th><th className="p-2 text-left">{t("hermTriggers")}</th><th className="p-2 text-left">{t("hermCrons")}</th><th className="p-2 text-left">{t("hermMigrations")}</th><th className="p-2 text-left">{t("hermChanges")}</th></tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-border hover:bg-secondary">
                <td className="whitespace-nowrap p-2 text-xs">{fmtDate(c.createdAt)}</td>
                <td className="p-2 font-bold">{c.checkpointType}</td>
                <td className="p-2">{c.tableCount ?? "—"}</td>
                <td className="p-2">{c.functionCount ?? "—"}</td>
                <td className="p-2">{c.triggerCount ?? "—"}</td>
                <td className="p-2">{c.cronCount ?? "—"}</td>
                <td className="p-2">{c.migrationCount ?? "—"}</td>
                <td className={`p-2 font-bold ${c.changesCount > 0 ? "text-orange-600" : ""}`}>{c.changesCount}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={8} className="p-3 text-center text-sm text-muted-foreground">{t("hermNoData")}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
