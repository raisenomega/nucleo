import { FileDown, ArrowLeft } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { usePdfExport } from "@shared/hooks/usePdfExport";
import { imgToDataUri } from "@shared/lib/img-to-data-uri";
import { publicLandingHref } from "@shared/lib/public-landing-href";
import { DEFAULT_PDF_COLORS } from "@shared/pdf/pdf-brand";
import { isContractError, type PublicContractResp } from "@orders/infrastructure/supabase-contract-share.repository";

// v2a.5 · Página pública branded del contrato firmado (patrón /factura y /orden). INFRA DORMIDA: nada la
// enlaza todavía. Marca 100% desde el RPC (white-label: ni nombres ni colores hex pueden vivir en src/).
// Sello de tiempo SIN toLocaleString a propósito: esta pantalla es la cara visible de una PRUEBA legal y
// tiene que mostrar exactamente el mismo instante que el PDF, que se imprime idéntico venga de donde venga.
const stamp = (iso: string) => (iso || "").replace("T", " ").slice(0, 16);
// Etiqueta técnica idéntica en ES y EN → no pasa por i18n (meterla al diccionario sería ruido).
const HASH = "SHA-256";

export function PublicContractView({ data }: { data: PublicContractResp }) {
  const { t } = useI18n();
  const { generating, exportPdf } = usePdfExport();
  if (isContractError(data)) {
    // 'rate_limited' NO es culpa del firmante (su token es válido): mensaje distinto de 'not_found' para que
    // no crea que su contrato desapareció; el enlace de vuelta le deja una salida en ambos casos.
    const msg = data.error === "rate_limited" ? t("lpContactErrorRateLimit") : t("spNotFoundDesc");
    return (<main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background p-4 text-center text-foreground">
      <h1 className="text-lg font-bold">{t("spNotFoundTitle")}</h1><p className="text-sm text-muted-foreground">{msg}</p>
      <a href={publicLandingHref()} className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 font-bold"><ArrowLeft className="h-4 w-4" /> {t("backToHome")}</a>
    </main>);
  }
  const c = data;
  const primary = c.primary_color || DEFAULT_PDF_COLORS.primary; const accent = c.accent_color || DEFAULT_PDF_COLORS.accent;
  const labels = { title: t("contract"), summary: t("executiveSummary"), signedBy: t("signature"), email: t("email"),
    signedAt: t("date"), ip: t("secIp"), hash: HASH, integrity: `${t("verified")} · ${HASH}` };
  // El logo se resuelve a data-URI AQUÍ y no dentro del PDF: imgToDataUri usa FileReader (sólo navegador) y
  // devuelve null para SVG porque el <Image> de react-pdf no lo soporta y reventaría el documento entero.
  // El import de ContractPdf es dinámico: arrastra @react-pdf/renderer y no puede entrar ni al bundle ni al SSR.
  const buildDoc = async () => {
    const { contractDoc } = await import("@shared/pdf/ContractPdf");
    return contractDoc({ ...c, tenant_name: c.tenant_name || "", primary_color: primary, accent_color: accent },
      labels, c.logo_url ? await imgToDataUri(c.logo_url) : null);
  };
  return (
    <main className="min-h-screen bg-background p-4 text-foreground">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex items-center gap-3 border-b-2 pb-3" style={{ borderColor: primary }}>
          {c.logo_url && <img src={c.logo_url} alt="" className="h-12 w-12 object-contain" />}
          <div><h1 className="text-xl font-bold" style={{ color: primary }}>{c.tenant_name}</h1>
            <p className="text-sm text-muted-foreground">{t("contract")} {c.contract_number}</p></div>
        </div>
        <div className="grid gap-1 rounded-lg border border-border p-3 text-sm sm:grid-cols-2">
          <p><span className="text-muted-foreground">{t("signature")}: </span><span className="font-bold">{c.signer_name}</span></p>
          <p><span className="text-muted-foreground">{t("email")}: </span>{c.signer_email}</p>
          <p><span className="text-muted-foreground">{t("date")}: </span>{stamp(c.signed_at)}</p>
          {c.ip_address && <p><span className="text-muted-foreground">{t("secIp")}: </span>{c.ip_address}</p>}
        </div>
        {c.terms_summary && <div className="rounded-lg border p-3 text-sm" style={{ borderColor: accent }}>
          <p className="font-bold" style={{ color: primary }}>{t("executiveSummary")}</p>
          <p className="whitespace-pre-wrap text-muted-foreground">{c.terms_summary}</p></div>}
        {/* whitespace-pre-wrap: el snapshot es texto plano con saltos significativos; reformatearlo alteraría
            visualmente lo que la persona firmó, y lo que se muestra debe ser el texto firmado, no un resumen. */}
        <section><h2 className="mb-1 font-bold" style={{ color: primary }}>{t("terms")}</h2>
          <div className="whitespace-pre-wrap text-sm leading-relaxed">{c.terms}</div></section>
        {/* El hash ES la prueba de integridad (permite recomputar el snapshot y demostrar que no se tocó):
            se muestra siempre, completo y con break-all para que se pueda copiar sin recortes. */}
        <div className="rounded-lg border border-border p-3 text-xs">
          <span className="text-muted-foreground">{HASH}: </span><span className="break-all font-mono">{c.terms_hash}</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href={publicLandingHref()} className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 font-bold text-foreground"><ArrowLeft className="h-4 w-4" /> {t("backToHome")}</a>
          <button type="button" disabled={generating} onClick={() => void exportPdf(buildDoc)} className="flex items-center gap-2 rounded-lg px-4 py-2 font-bold text-white disabled:opacity-50" style={{ backgroundColor: primary }}><FileDown className="h-4 w-4" /> {t("downloadPdf")}</button>
        </div>
      </div>
    </main>
  );
}
