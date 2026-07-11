import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useI18n } from "@shared/i18n";
import type { EmployeeCertification, CertFormData } from "@admin/domain/employee-document.types";

const EMPTY: CertFormData = { certificationName: "", certificationNumber: "", issuedDate: "", expirationDate: "", status: "active" };

export function ProfileCertifications({ certs, onAdd, onUpdate, onRemove }: {
  certs: readonly EmployeeCertification[];
  onAdd: (c: CertFormData) => void; onUpdate: (id: string, c: CertFormData) => void; onRemove: (id: string) => void;
}) {
  const { t } = useI18n();
  const [f, setF] = useState<CertFormData>(EMPTY);
  const fld = "rounded-lg border border-border bg-background p-2 text-sm";
  const soon = (d: string | null) => !!d && new Date(d).getTime() - Date.now() < 2.592e9;
  const cf = (c: EmployeeCertification): CertFormData => ({ certificationName: c.certificationName, certificationNumber: c.certificationNumber, issuedDate: c.issuedDate ?? "", expirationDate: c.expirationDate ?? "", status: c.status });
  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-5">
      <h3 className="font-body font-bold text-foreground">{t("certifications")}</h3>
      <div className="flex flex-wrap items-end gap-2">
        <input value={f.certificationName} onChange={(e) => setF({ ...f, certificationName: e.target.value })} placeholder={t("certName")} className={fld} />
        <input value={f.certificationNumber} onChange={(e) => setF({ ...f, certificationNumber: e.target.value })} placeholder={t("certNumber")} className={fld} />
        <input type="date" value={f.issuedDate} onChange={(e) => setF({ ...f, issuedDate: e.target.value })} className={fld} />
        <input type="date" value={f.expirationDate} onChange={(e) => setF({ ...f, expirationDate: e.target.value })} className={fld} />
        <button type="button" onClick={() => { if (f.certificationName) { onAdd(f); setF(EMPTY); } }} className="rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-bold">{t("addCert")}</button>
      </div>
      <div className="overflow-x-auto"><table className="w-full text-sm">
        <thead className="text-xs uppercase text-muted-foreground"><tr>
          <th className="py-1 text-left">{t("certName")}</th><th className="text-left">{t("certNumber")}</th>
          <th className="text-left">{t("expirationDate")}</th><th className="text-right">{t("actions")}</th></tr></thead>
        <tbody>{certs.map((c) => (
          <tr key={c.id} className="border-t border-border">
            <td className="py-1">{c.certificationName}</td><td>{c.certificationNumber || "—"}</td>
            <td className={soon(c.expirationDate) ? "text-red-600" : ""}>{c.expirationDate ?? "—"}</td>
            <td><div className="flex justify-end gap-2">
              <button type="button" onClick={() => { const n = window.prompt(t("certName"), c.certificationName); if (n) onUpdate(c.id, { ...cf(c), certificationName: n }); }} className="text-primary"><Pencil className="h-4 w-4" /></button>
              <button type="button" onClick={() => onRemove(c.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div></td>
          </tr>))}</tbody>
      </table></div>
    </div>
  );
}
