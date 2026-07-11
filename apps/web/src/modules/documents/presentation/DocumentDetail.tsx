import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import { DOC_CAT_KEY, DOC_ST_KEY, DOC_ST_COLOR } from "@documents/presentation/doc-ui";
import type { Doc, DocStatus } from "@documents/domain/document.types";

// Detalle: preview PDF (iframe) o imagen (img) vía signed URL + datos + renovar/cancelar.
export function DocumentDetail({ doc, getUrl, canManage, onStatus, onClose }: {
  doc: Doc; getUrl: (path: string) => Promise<string | null>; canManage: boolean;
  onStatus: (status: DocStatus, newExp: string | null) => void; onClose: () => void;
}) {
  const { t } = useI18n();
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => { void getUrl(doc.fileUrl).then(setUrl); }, [doc.fileUrl, getUrl]);
  const isPdf = /\.pdf$/i.test(doc.fileName);
  const isImg = /\.(png|jpe?g|gif|webp)$/i.test(doc.fileName);
  const renew = () => { const d = window.prompt(`${t("renew")} — YYYY-MM-DD`); if (d) onStatus("active", d); };
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-foreground">{doc.title}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <div className="space-y-4 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-secondary px-2 py-0.5 text-xs font-bold">{t(DOC_CAT_KEY[doc.category])}</span>
          <span className={`rounded px-2 py-0.5 text-xs font-bold ${DOC_ST_COLOR[doc.status]}`}>{t(DOC_ST_KEY[doc.status])}</span>
        </div>
        {url && (isPdf ? <iframe src={url} title={doc.title} className="h-96 w-full rounded-lg border border-border" />
          : isImg ? <img src={url} alt={doc.title} className="max-h-96 w-full rounded-lg object-contain" />
          : <a href={url} target="_blank" rel="noreferrer" className="text-primary underline">{doc.fileName}</a>)}
        {doc.parties.length > 0 && <p className="text-sm"><span className="font-bold">{t("parties")}: </span>{doc.parties.join(", ")}</p>}
        {doc.expirationDate && <p className="text-sm"><span className="font-bold">{t("expirationDate")}: </span>{doc.expirationDate}</p>}
        {doc.tags.length > 0 && <p className="text-xs text-muted-foreground">{doc.tags.join(" · ")}</p>}
        {canManage && (
          <div className="flex gap-2">
            <button type="button" onClick={renew} className="rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-bold">{t("renew")}</button>
            <button type="button" onClick={() => onStatus("cancelled", null)} className="rounded-lg bg-destructive px-3 py-2 text-sm font-bold text-white">{t("cancel")}</button>
          </div>)}
      </div>
    </ScreenModal>
  );
}
