import type { ReactElement } from "react";
import { View, Text } from "@react-pdf/renderer";
import { PdfDocument } from "@shared/pdf/PdfDocument";
import { PdfSignatureLine } from "@shared/pdf/PdfSignatureLine";
import { doc } from "@shared/pdf/pdf-styles";
import type { PdfBrand } from "@shared/pdf/pdf-brand";

// PDF del contrato firmado (v2a.5). El MISMO árbol sirve a los dos caminos: descarga en el navegador
// (pdf().toBlob) y renderToBuffer dentro de un handler Nitro → aquí no puede entrar NADA del browser:
// ni fetch de imágenes, ni i18n context. El logo llega ya resuelto como data-URI desde quien llama
// (browser: imgToDataUri; server: fetch+base64), porque imgToDataUri usa FileReader y en Node no existe.
// Los datos son literalmente el payload OK de get_public_contract; las etiquetas entran por props.
export interface ContractPdfData {
  contract_number: string; signed_at: string; signer_name: string; signer_email: string; locale: string;
  terms: string; terms_summary: string | null; terms_hash: string; ip_address: string | null;
  tenant_name: string; primary_color: string; accent_color: string; logo_url: string | null;
}
export interface ContractPdfLabels {
  title: string; summary: string; signedBy: string; email: string; signedAt: string; ip: string; hash: string; integrity: string;
}

// `terms` es un snapshot de texto plano de ~16 secciones / ~15k chars. Un solo <Text> gigante obliga a
// react-pdf a medir un bloque monolítico y la paginación se degrada (saltos en mitad de párrafo, huecos).
// Heurística: cortar por línea en blanco (así vienen separadas las secciones del snapshot) y, dentro de
// cada bloque, tratar la 1ª línea como título si es corta (<=80) y queda cuerpo detrás ("3. GARANTÍA\n…").
// Es tolerante: si el snapshot cambia de forma, lo peor que pasa es que el bloque salga sin título.
export function splitTerms(terms: string): { title: string; body: string }[] {
  return (terms || "").split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean).map((b) => {
    const [first, ...rest] = b.split("\n"); const head = (first ?? "").trim();
    return rest.length > 0 && head.length <= 80 ? { title: head, body: rest.join("\n").trim() } : { title: "", body: b };
  });
}

// Sin toLocaleString a propósito: el ICU del navegador y el del runtime de Nitro no coinciden, y este
// documento es prueba legal → el mismo contrato debe imprimirse byte-idéntico venga por donde venga.
const stamp = (iso: string) => (iso || "").replace("T", " ").slice(0, 16);

export function ContractPdf({ data: d, labels: l, logo = null }: { data: ContractPdfData; labels: ContractPdfLabels; logo?: string | null }) {
  const brand: PdfBrand = { name: d.tenant_name, logo, primaryColor: d.primary_color, accentColor: d.accent_color };
  const row = (k: string, v: string) => (v ? <View style={{ flexDirection: "row", paddingVertical: 1 }}><Text style={[doc.muted, { width: "28%" }]}>{k}</Text><Text>{v}</Text></View> : null);
  return (
    <PdfDocument title={`${l.title} ${d.contract_number}`} brand={brand}
      meta={<><Text style={doc.docNumber}>{d.contract_number}</Text><Text>{`${l.signedAt}: ${stamp(d.signed_at)}`}</Text></>}>
      {d.terms_summary
        ? <View style={doc.box}><Text style={doc.bold}>{l.summary}</Text><Text style={doc.muted}>{d.terms_summary}</Text></View>
        : null}
      {/* minPresenceAhead evita el título huérfano al pie de página; cada párrafo es su propio <Text> para
          que el motor pueda cortar entre párrafos y no dentro de un bloque de 15k caracteres. */}
      {splitTerms(d.terms).map((s, i) => (
        <View key={i} minPresenceAhead={28}>
          {s.title ? <Text style={doc.h2}>{s.title}</Text> : null}
          {s.body.split("\n").map((p, j) => <Text key={j} style={{ marginBottom: 3, lineHeight: 1.4 }}>{p}</Text>)}
        </View>
      ))}
      <PdfSignatureLine labels={[`${l.signedBy}: ${d.signer_name}`]} />
      {/* Bloque probatorio: nombre tecleado + email + sello de tiempo + IP + hash SHA-256 del texto firmado.
          El hash es LA prueba de integridad (permite recomputar el snapshot), así que sale impreso siempre. */}
      <View style={[doc.box, { marginTop: 10 }]}>
        {row(l.email, d.signer_email)}{row(l.signedAt, stamp(d.signed_at))}{row(l.ip, d.ip_address || "")}
        <View style={{ flexDirection: "row", paddingVertical: 1 }}>
          <Text style={[doc.muted, { width: "28%" }]}>{l.hash}</Text><Text style={{ fontSize: 8 }}>{d.terms_hash}</Text>
        </View>
        <Text style={[doc.muted, { marginTop: 4 }]}>{l.integrity}</Text>
      </View>
    </PdfDocument>
  );
}

// Factory apta para renderToBuffer / renderPdfBlob (mismo patrón que publicInvoiceDoc/publicOrderDoc):
// devuelve el elemento ya armado. Síncrona porque el logo YA viene resuelto: nada que await aquí dentro.
export function contractDoc(d: ContractPdfData, l: ContractPdfLabels, logo?: string | null): ReactElement {
  return <ContractPdf data={d} labels={l} logo={logo ?? null} />;
}
