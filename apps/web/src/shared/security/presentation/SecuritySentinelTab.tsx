import { useState } from "react";
import { useI18n } from "@shared/i18n";
import type { ISecurityRepository, SentinelScan } from "@shared/security/domain/security.types";
import { fmtDate } from "./security.fmt";

const TYPES = ["rls_audit", "gl_integrity", "orphan_check", "daily_summary"];

export function SecuritySentinelTab({ scans, repo, onChange }: { scans: SentinelScan[]; repo: ISecurityRepository; onChange: () => void }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState("");
  const run = async (type: string) => { setBusy(type); await repo.runScan(type); setBusy(""); onChange(); };
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {TYPES.map((ty) => (
          <button key={ty} type="button" disabled={busy === ty} onClick={() => void run(ty)}
            className="rounded-lg bg-secondary px-3 py-1.5 text-sm font-bold disabled:opacity-50">
            {busy === ty ? t("secRunning") : `${t("secScanNow")}: ${ty}`}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full font-body text-sm">
          <thead className="bg-secondary text-xs uppercase text-muted-foreground">
            <tr><th className="p-2 text-left">{t("secScannedAt")}</th><th className="p-2 text-left">{t("secScanType")}</th><th className="p-2 text-left">{t("secScore")}</th><th className="p-2 text-left">{t("secResult")}</th><th className="p-2 text-left">{t("secIssues")}</th></tr>
          </thead>
          <tbody>
            {scans.map((s) => (
              <tr key={s.id} className="border-t border-border hover:bg-secondary">
                <td className="whitespace-nowrap p-2 text-xs">{fmtDate(s.scannedAt)}</td>
                <td className="p-2 font-bold">{s.scanType}</td>
                <td className="p-2">{s.score ?? "—"}</td>
                <td className="p-2">{s.passed ? `✅ ${t("secPass")}` : `🔴 ${t("secFail")}`}</td>
                <td className="p-2">{s.issuesCount}</td>
              </tr>
            ))}
            {scans.length === 0 && <tr><td colSpan={5} className="p-3 text-center text-sm text-muted-foreground">{t("secNoScans")}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
