import { View, Text } from "@react-pdf/renderer";
import { PdfDocument } from "@shared/pdf/PdfDocument";
import { PdfSignatureLine } from "@shared/pdf/PdfSignatureLine";
import { doc } from "@shared/pdf/pdf-styles";
import type { PdfBrand } from "@shared/pdf/pdf-brand";

// Recibo de custodia (asset_custody_receipt.html): bloques (unidad/salida/devolución/GPS) + firmas.
export interface CustodyDocProps {
  brand: PdfBrand; docTitle: string;
  blocks: { title: string; lines: string[] }[];
  signatureLabels: string[];
}

export function CustodyReceiptPdf({ brand, docTitle, blocks, signatureLabels }: CustodyDocProps) {
  return (
    <PdfDocument title={docTitle} brand={brand} meta={<Text style={doc.docNumber}>{docTitle}</Text>}>
      {blocks.map((b, i) => (
        <View key={i} style={doc.box}>
          <Text style={doc.bold}>{b.title}</Text>
          {b.lines.filter(Boolean).map((l, j) => <Text key={j} style={[doc.muted, { marginTop: 2 }]}>{l}</Text>)}
        </View>
      ))}
      <PdfSignatureLine labels={signatureLabels} />
    </PdfDocument>
  );
}
