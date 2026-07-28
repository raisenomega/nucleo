import { useI18n } from "@shared/i18n";
import type { GuardianEvent } from "@shared/security/domain/security.types";
import { SeverityBadge } from "./SeverityBadge";
import { fmtDate } from "./security.fmt";

export function EventRow({ e, onResolve, onBlock }: { e: GuardianEvent; onResolve: (e: GuardianEvent) => void; onBlock: (e: GuardianEvent) => void }) {
  const { t } = useI18n();
  return (
    <tr className="border-t border-border hover:bg-secondary">
      <td className="whitespace-nowrap p-2 text-xs">{fmtDate(e.createdAt)}</td>
      <td className="p-2 font-bold">{e.eventType}</td>
      <td className="p-2"><SeverityBadge level={e.severity} /></td>
      <td className="p-2">{e.userName ?? "—"}</td>
      <td className="p-2 text-muted-foreground">{e.ipAddress ?? "—"}</td>
      <td className="p-2">{e.resolved ? t("secResolvedYes") : t("secResolvedNo")}</td>
      <td className="whitespace-nowrap p-2">
        {!e.resolved && <button type="button" onClick={() => onResolve(e)} className="mr-2 text-xs font-bold text-accent">{t("secResolve")}</button>}
        {e.ipAddress && <button type="button" onClick={() => onBlock(e)} className="text-xs font-bold text-red-600">{t("secBlockIp")}</button>}
      </td>
    </tr>
  );
}
