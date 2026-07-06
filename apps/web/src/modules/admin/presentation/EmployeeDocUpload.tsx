import { useState } from "react";
import { Upload } from "lucide-react";
import { useI18n } from "@shared/i18n";
import type { DocType } from "@admin/domain/employee-document.types";

export const DOC_LABELS: Record<DocType, string> = {
  i9: "I-9", w4: "W-4 / 499R-4.1", contract: "Contrato", medical_cert: "Cert. médico",
  background_check: "Buena conducta", drug_test: "Drug test", id_photo: "ID con foto", ss_card: "Tarjeta SS",
  education: "Educación", certification: "Certificación", reference: "Referencia", nda: "NDA", other: "Otro",
};
const TYPES = Object.keys(DOC_LABELS) as DocType[];

export function EmployeeDocUpload({ onUpload }: { onUpload: (file: File, docType: DocType, date: string, notes: string) => void }) {
  const { t } = useI18n();
  const [docType, setDocType] = useState<DocType>("other");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  const lbl = "block space-y-1 text-xs font-bold text-muted-foreground";
  function submit() { if (file) { onUpload(file, docType, date, notes); setFile(null); setNotes(""); setDate(""); } }
  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className={lbl}><span>{t("category")}</span>
          <select value={docType} onChange={(e) => setDocType(e.target.value as DocType)} className={fld}>
            {TYPES.map((ty) => <option key={ty} value={ty}>{DOC_LABELS[ty]}</option>)}</select></label>
        <label className={lbl}><span>{t("date")}</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={fld} /></label>
        <label className={`${lbl} sm:col-span-2`}><span>{t("notes")}</span>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("notes")} className={fld} /></label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-bold text-foreground hover:bg-secondary">
          <Upload className="h-4 w-4" /> {file ? file.name : t("addEvidence")}
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="hidden" /></label>
        <button type="button" onClick={submit} disabled={!file} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-40">{t("uploadDoc")}</button>
      </div>
    </div>
  );
}
