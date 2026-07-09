import { useI18n } from "@shared/i18n";

const ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml";

// Sección Identidad: nombre corto/legal + dropzones de logo y favicon (con preview).
export function ThemeIdentitySection({ displayName, legalName, logoUrl, faviconUrl, onField, onUpload }: {
  displayName: string; legalName: string; logoUrl: string | null; faviconUrl: string | null;
  onField: (k: string, v: string) => void; onUpload: (kind: "logo" | "favicon", file: File) => void;
}) {
  const { t } = useI18n();
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  const lbl = "text-xs font-bold text-muted-foreground";
  const asset = (kind: "logo" | "favicon", url: string | null) => (
    <div className="space-y-1">
      <span className={lbl}>{t(kind === "logo" ? "logoLbl" : "faviconLbl")}</span>
      <div className="flex items-center gap-3">
        {url ? <img src={url} alt="" className="h-12 w-12 rounded border border-border object-contain" />
          : <div className="grid h-12 w-12 place-items-center rounded border border-dashed border-border text-xs text-muted-foreground">—</div>}
        <input type="file" accept={ACCEPT} className={fld}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(kind, f); }} />
      </div>
    </div>
  );
  return (
    <>
      <label className="block space-y-1"><span className={lbl}>{t("shortNameLbl")}</span>
        <input value={displayName} onChange={(e) => onField("display_name", e.target.value)} className={fld} />
        <span className="text-xs text-muted-foreground">{t("shortNameHelp")}</span></label>
      <label className="block space-y-1"><span className={lbl}>{t("legalNameLbl")}</span>
        <input value={legalName} onChange={(e) => onField("legal_name", e.target.value)} className={fld} /></label>
      {asset("logo", logoUrl)}
      {asset("favicon", faviconUrl)}
      <p className="text-xs text-muted-foreground">{t("assetsHelp")}</p>
    </>
  );
}
