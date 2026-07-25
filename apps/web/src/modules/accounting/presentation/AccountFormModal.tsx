import { useState } from "react";
import { z } from "zod";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import { ACCOUNT_TYPES, CODE_HINT } from "@accounting/presentation/account-ui";
import type { ChartAccount, AccountFormData, AccountType, Result } from "@accounting/domain/chart-of-accounts.types";

const schema = z.object({ accountCode: z.string().trim().min(3).max(6), accountName: z.string().trim().min(1),
  accountType: z.enum(["asset", "liability", "equity", "revenue", "cogs", "expense"]) });

export function AccountFormModal({ initial, headers, onSubmit, onClose }: {
  initial?: ChartAccount; headers: readonly ChartAccount[];
  onSubmit: (d: AccountFormData) => Promise<Result<ChartAccount, string>>; onClose: () => void;
}) {
  const { t } = useI18n();
  const sys = initial?.isSystem ?? false;
  const [code, setCode] = useState(initial?.accountCode ?? "");
  const [name, setName] = useState(initial?.accountName ?? "");
  const [type, setType] = useState<AccountType>(initial?.accountType ?? "expense");
  const [parentId, setParentId] = useState(initial?.parentId ?? "");
  const [isHeader, setIsHeader] = useState(initial?.isHeader ?? false);
  const [desc, setDesc] = useState(initial?.description ?? "");
  const [err, setErr] = useState("");
  const parents = headers.filter((h) => h.accountType === type && h.id !== initial?.id);
  const field = "w-full rounded-lg border border-border bg-background p-2 text-sm disabled:opacity-60";
  const lbl = "text-xs font-bold text-muted-foreground";
  async function save() {
    const p = schema.safeParse({ accountCode: code, accountName: name, accountType: type });
    if (!p.success) { setErr(t("requiredFields")); return; }
    const r = await onSubmit({ accountCode: code, accountName: name, accountType: type, parentId: parentId || null, isHeader, description: desc || null });
    if (r.ok) onClose(); else setErr(r.error);
  }
  return (
    <ScreenModal onClose={onClose}>
      <div className="space-y-4 p-4 md:p-6">
        <h2 className="font-display text-lg font-bold text-foreground">{initial ? t("editAccount") : t("createAccount")}</h2>
        <label className="block space-y-1"><span className={lbl}>{t("accountCode")} ({CODE_HINT[type]})</span>
          <input value={code} disabled={!!initial} onChange={(e) => setCode(e.target.value)} className={`${field} font-mono`} placeholder="6250" /></label>
        <label className="block space-y-1"><span className={lbl}>{t("accountName")}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className={field} /></label>
        <label className="block space-y-1"><span className={lbl}>{t("accountType")}{sys && ` · ${t("systemAccount")}`}</span>
          <select value={type} disabled={sys} onChange={(e) => setType(e.target.value as AccountType)} className={field}>
            {ACCOUNT_TYPES.map((x) => <option key={x} value={x}>{t(x)}</option>)}</select></label>
        <label className="block space-y-1"><span className={lbl}>{t("parentAccount")}</span>
          <select value={parentId} onChange={(e) => setParentId(e.target.value)} className={field}>
            <option value="">—</option>{parents.map((h) => <option key={h.id} value={h.id}>{h.accountCode} · {h.accountName}</option>)}</select></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isHeader} onChange={(e) => setIsHeader(e.target.checked)} />{t("header")} <span className="text-xs text-muted-foreground">({t("postable")}: no)</span></label>
        <label className="block space-y-1"><span className={lbl}>{t("description")}</span>
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} className={field} /></label>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-sm font-bold">{t("cancel")}</button>
          <button type="button" onClick={() => void save()} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">{t("save")}</button></div>
      </div>
    </ScreenModal>
  );
}
