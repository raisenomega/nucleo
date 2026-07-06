import { useState } from "react";
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
  const fld = "rounded-lg border border-border bg-background p-2 text-sm";
  function submit() { if (file) { onUpload(file, docType, date, notes); setFile(null); setNotes(""); } }
  return (
    <div className="flex flex-wrap items-end gap-2 rounded-lg border border-border bg-card p-4">
      <select value={docType} onChange={(e) => setDocType(e.target.value as DocType)} className={fld}>
        {TYPES.map((ty) => <option key={ty} value={ty}>{DOC_LABELS[ty]}</option>)}</select>
      <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={fld} />
      <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("notes")} className={fld} />
      <button type="button" onClick={submit} disabled={!file} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold disabled:opacity-50">{t("uploadDoc")}</button>
    </div>
  );
}
