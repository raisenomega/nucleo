import { Eye, Trash2 } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { signEmployeeDoc } from "@admin/infrastructure/supabase-employee-docs.storage";
import { EmployeeDocUpload, DOC_LABELS } from "@admin/presentation/EmployeeDocUpload";
import type { EmployeeDocument, DocType } from "@admin/domain/employee-document.types";

const REQUIRED: DocType[] = ["i9", "w4", "contract", "background_check", "drug_test", "medical_cert"];

export function ProfileDocumentsTab({ docs, onUpload, onRemove }: {
  docs: readonly EmployeeDocument[];
  onUpload: (file: File, docType: DocType, date: string, notes: string) => void; onRemove: (id: string, url: string) => void;
}) {
  const { t } = useI18n();
  const present = new Set(docs.map((d) => d.docType));
  const have = REQUIRED.filter((r) => present.has(r));
  const missing = REQUIRED.filter((r) => !present.has(r));
  const pct = Math.round((have.length / REQUIRED.length) * 100);
  async function view(url: string) { const s = await signEmployeeDoc(url); if (s) window.open(s, "_blank"); }
  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-lg border border-border bg-card p-5">
        <div className="text-sm font-bold">{t("requiredDocs")}: {have.length}/{REQUIRED.length} {missing.length ? "⚠️" : "✅"}</div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-secondary"><div className="h-full bg-primary" style={{ width: `${pct}%` }} /></div>
        {missing.length > 0 && <div className="text-xs text-muted-foreground">{t("missing")}: {missing.map((m) => DOC_LABELS[m]).join(", ")}</div>}
      </div>
      <EmployeeDocUpload onUpload={onUpload} />
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-xs uppercase text-muted-foreground"><tr>
            <th className="px-3 py-2 text-left">{t("category")}</th><th className="px-3 py-2 text-left">{t("itemName")}</th>
            <th className="px-3 py-2 text-left">{t("date")}</th><th className="px-3 py-2 text-right">{t("actions")}</th></tr></thead>
          <tbody>
            {docs.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">{t("noRecords")}</td></tr>}
            {docs.map((d) => (
              <tr key={d.id} className="border-t border-border">
                <td className="px-3 py-2">{DOC_LABELS[d.docType]}</td><td className="px-3 py-2">{d.fileName}</td>
                <td className="px-3 py-2">{d.documentDate ?? d.createdAt.slice(0, 10)}</td>
                <td className="px-3 py-2"><div className="flex justify-end gap-2">
                  <button type="button" onClick={() => void view(d.fileUrl)} className="text-foreground"><Eye className="h-4 w-4" /></button>
                  <button type="button" onClick={() => onRemove(d.id, d.fileUrl)} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
