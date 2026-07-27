import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { PdfDocument } from "@shared/pdf/PdfDocument";
import { PdfSignatureLine } from "@shared/pdf/PdfSignatureLine";
import { doc } from "@shared/pdf/pdf-styles";
import type { PdfBrand } from "@shared/pdf/pdf-brand";

const s = StyleSheet.create({
  cert: { marginTop: 48, padding: 32, borderWidth: 3, borderRadius: 8, alignItems: "center" },
  h1: { fontSize: 24, fontFamily: "Helvetica-Bold", letterSpacing: 2, marginBottom: 20, textAlign: "center" },
  who: { fontSize: 19, fontFamily: "Helvetica-Bold", marginVertical: 14, textAlign: "center" },
  what: { fontSize: 12, textAlign: "center", lineHeight: 1.7 },
});

// Certificado de capacitación (certificate.html): borde decorativo + nombre + curso + score + firma.
export function CertificatePdf({ brand, data, labels }: {
  brand: PdfBrand; data: { employeeName: string; courseName: string; completedAt: string; score: number | null };
  labels: { docLabel: string; title: string; certifies: string; completed: string; score: string; authorized: string };
}) {
  return (
    <PdfDocument title={labels.title} brand={brand}
      meta={<><Text style={doc.docNumber}>{labels.docLabel}</Text><Text>{data.completedAt}</Text></>}>
      <View style={[s.cert, { borderColor: brand.primaryColor }]}>
        <Text style={[s.h1, { color: brand.primaryColor }]}>{labels.title}</Text>
        <Text style={s.what}>{brand.name} {labels.certifies}</Text>
        <Text style={s.who}>{data.employeeName}</Text>
        <Text style={s.what}>{labels.completed} «{data.courseName}»{data.score != null ? ` — ${labels.score} ${Math.round(data.score)}/100` : ""}</Text>
        <PdfSignatureLine labels={[`${labels.authorized} — ${brand.name}`]} />
      </View>
    </PdfDocument>
  );
}
