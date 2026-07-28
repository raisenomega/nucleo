import { useState } from "react";
import { useI18n } from "@shared/i18n";
import type { IpWatchEntry, ISecurityRepository } from "@shared/security/domain/security.types";
import { AddIpModal } from "./AddIpModal";
import { fmtDate } from "./security.fmt";

const TONE: Record<string, string> = { block: "text-red-600", watch: "text-orange-600", allow: "text-green-600" };

export function SecurityWatchlistTab({ items, repo, onChange }: { items: IpWatchEntry[]; repo: ISecurityRepository; onChange: () => void }) {
  const { t } = useI18n();
  const [add, setAdd] = useState(false);
  const remove = async (ip: string) => { await repo.manageIp(ip, "remove"); onChange(); };
  return (
    <div className="space-y-3">
      <button type="button" onClick={() => setAdd(true)} className="rounded-lg bg-primary px-3 py-1.5 text-sm font-bold text-primary-foreground">+ {t("secAddIp")}</button>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full font-body text-sm">
          <thead className="bg-secondary text-xs uppercase text-muted-foreground">
            <tr><th className="p-2 text-left">{t("secIp")}</th><th className="p-2 text-left">{t("secListType")}</th><th className="p-2 text-left">{t("secReason")}</th><th className="p-2 text-left">{t("secHits")}</th><th className="p-2 text-left">{t("secExpires")}</th><th className="p-2"></th></tr>
          </thead>
          <tbody>
            {items.map((w) => (
              <tr key={w.id} className="border-t border-border hover:bg-secondary">
                <td className="p-2 font-mono">{w.ipAddress}</td>
                <td className={`p-2 font-bold ${TONE[w.listType] ?? ""}`}>{w.listType}</td>
                <td className="p-2 text-muted-foreground">{w.reason ?? "—"}</td>
                <td className="p-2">{w.hits}</td>
                <td className="p-2 text-xs">{w.expiresAt ? fmtDate(w.expiresAt) : t("secNever")}</td>
                <td className="p-2"><button type="button" onClick={() => void remove(w.ipAddress)} className="text-xs font-bold text-red-600">{t("secRemove")}</button></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={6} className="p-3 text-center text-sm text-muted-foreground">{t("noData")}</td></tr>}
          </tbody>
        </table>
      </div>
      {add && <AddIpModal repo={repo} onClose={() => setAdd(false)} onDone={() => { setAdd(false); onChange(); }} />}
    </div>
  );
}
