import { View, Text, Image } from "@react-pdf/renderer";
import { PdfDocument } from "@shared/pdf/PdfDocument";
import { PdfTable } from "@shared/pdf/PdfTable";
import { doc } from "@shared/pdf/pdf-styles";
import type { PdfBrand } from "@shared/pdf/pdf-brand";

// Ficha de activo (asset_detail.html): imagen + datos generales (2 col) + tablas custodia/mantenimiento/rutas.
export interface AssetDocProps {
  brand: PdfBrand; docTitle: string; image: string | null;
  infoRows: { label: string; value: string }[];
  sections: { title: string; headers: string[]; rows: (string | number)[][] }[];
}

export function AssetDetailPdf({ brand, docTitle, image, infoRows, sections }: AssetDocProps) {
  return (
    <PdfDocument title={docTitle} brand={brand} meta={<Text style={doc.docNumber}>{docTitle}</Text>}>
      {image ? <Image src={image} style={{ maxHeight: 130, marginBottom: 8, borderRadius: 6, objectFit: "contain" }} /> : null}
      <View style={[doc.box, { flexDirection: "row", flexWrap: "wrap" }]}>
        {infoRows.map((r, i) => (
          <View key={i} style={{ width: "50%", flexDirection: "row", paddingVertical: 2 }}>
            <Text style={[doc.muted, { width: "45%" }]}>{r.label}</Text><Text>{r.value}</Text>
          </View>
        ))}
      </View>
      {sections.map((s, i) => (
        <View key={i}>
          <Text style={doc.h2}>{s.title}</Text>
          <PdfTable primaryColor={brand.primaryColor} headers={s.headers} rows={s.rows} numericFrom={s.headers.length} />
        </View>
      ))}
    </PdfDocument>
  );
}
