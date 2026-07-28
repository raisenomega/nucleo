import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import type { ISecurityRepository } from "@shared/security/domain/security.types";

export function AddIpModal({ repo, onClose, onDone }: { repo: ISecurityRepository; onClose: () => void; onDone: () => void }) {
  const { t } = useI18n();
  const [ip, setIp] = useState("");
  const [type, setType] = useState("block");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!ip.trim()) return;
    setBusy(true);
    await repo.manageIp(ip.trim(), "add", type, reason || undefined, null);
    setBusy(false); onDone();
  };
  const inp = "w-full rounded-lg border border-border bg-card p-2 text-sm";
  return (
    <ScreenModal onClose={onClose}>
      <div className="space-y-3 p-4">
        <h2 className="font-display font-bold text-foreground">{t("secAddIpTitle")}</h2>
        <input value={ip} onChange={(e) => setIp(e.target.value)} placeholder={t("secIp")} className={`${inp} font-mono`} />
        <select value={type} onChange={(e) => setType(e.target.value)} className={inp}>
          <option value="block">{t("secListBlock")}</option>
          <option value="watch">{t("secListWatch")}</option>
          <option value="allow">{t("secListAllow")}</option>
        </select>
        <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t("secReason")} className={inp} />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg bg-secondary px-3 py-1.5 text-sm font-bold">{t("cancel")}</button>
          <button type="button" disabled={busy} onClick={() => void submit()} className="rounded-lg bg-primary px-3 py-1.5 text-sm font-bold text-primary-foreground disabled:opacity-50">{t("secConfirm")}</button>
        </div>
      </div>
    </ScreenModal>
  );
}
