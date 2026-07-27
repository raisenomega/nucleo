import { View, Text } from "@react-pdf/renderer";
import { PdfDocument } from "@shared/pdf/PdfDocument";
import { PdfTable } from "@shared/pdf/PdfTable";
import { PdfTotals } from "@shared/pdf/PdfTotals";
import { PdfWatermark } from "@shared/pdf/PdfWatermark";
import { doc } from "@shared/pdf/pdf-styles";
import type { PdfBrand } from "@shared/pdf/pdf-brand";

// Documento comercial reutilizable (factura/cotización/lead): caja cliente + tabla de items + totales +
// watermark por estado + secciones extra (notas/términos). Todo texto ya traducido por el loader.
export interface SalesDocProps {
  brand: PdfBrand; docTitle: string; docNumber: string; metaLines: string[];
  watermark?: { text: string; ok?: boolean };
  clientTitle: string; clientName: string; clientLines: string[];
  itemHeaders: string[]; itemRows: (string | number)[][]; itemWidths?: number[];
  totals: { label: string; value: string; grand?: boolean }[];
  sections?: { title: string; body: string }[];
}

export function SalesDocPdf(p: SalesDocProps) {
  return (
    <PdfDocument title={p.docTitle} brand={p.brand}
      meta={<><Text style={doc.docNumber}>{p.docNumber}</Text>{p.metaLines.map((l, i) => <Text key={i}>{l}</Text>)}</>}>
      {p.watermark ? <PdfWatermark text={p.watermark.text} ok={p.watermark.ok} /> : null}
      <View style={doc.box}>
        <Text style={doc.h2}>{p.clientTitle}</Text>
        <Text style={doc.bold}>{p.clientName}</Text>
        {p.clientLines.filter(Boolean).map((l, i) => <Text key={i} style={doc.muted}>{l}</Text>)}
      </View>
      {p.itemRows.length > 0
        ? <PdfTable primaryColor={p.brand.primaryColor} headers={p.itemHeaders} rows={p.itemRows} widths={p.itemWidths} /> : null}
      <PdfTotals rows={p.totals} primaryColor={p.brand.primaryColor} />
      {p.sections?.filter((sec) => sec.body).map((sec, i) => (
        <View key={i}><Text style={doc.h2}>{sec.title}</Text><Text style={doc.muted}>{sec.body}</Text></View>
      ))}
    </PdfDocument>
  );
}
