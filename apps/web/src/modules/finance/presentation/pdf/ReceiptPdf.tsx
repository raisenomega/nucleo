import { View, Text } from "@react-pdf/renderer";
import { PdfDocument } from "@shared/pdf/PdfDocument";
import { doc } from "@shared/pdf/pdf-styles";
import type { PdfBrand } from "@shared/pdf/pdf-brand";

// Recibo genérico (ingreso/gasto/extraordinario) — equivale a income/expense/extraordinary_receipt.html.
// docTitle = "RECIBO DE INGRESO" etc.; rows = pares label/valor; section = bloque extra (justificación).
export function ReceiptPdf({ brand, docTitle, dateLine, rows, amountLabel, amount, note, section }: {
  brand: PdfBrand; docTitle: string; dateLine: string; rows: { label: string; value: string }[];
  amountLabel: string; amount: string; note?: string; section?: { title: string; body: string };
}) {
  const p = brand.primaryColor;
  return (
    <PdfDocument title={docTitle} brand={brand}
      meta={<><Text style={doc.docNumber}>{docTitle}</Text><Text>{dateLine}</Text></>}>
      <View style={[doc.box, { maxWidth: 430 }]}>
        {rows.map((r, i) => (
          <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 }}>
            <Text style={doc.muted}>{r.label}</Text><Text>{r.value}</Text>
          </View>
        ))}
        <View style={{ flexDirection: "row", justifyContent: "space-between", borderTopWidth: 2, borderTopColor: p, marginTop: 6, paddingTop: 6 }}>
          <Text style={[doc.bold, { color: p, fontSize: 12 }]}>{amountLabel}</Text>
          <Text style={[doc.bold, { color: p, fontSize: 12 }]}>{amount}</Text>
        </View>
        {note ? <Text style={[doc.muted, { marginTop: 6 }]}>{note}</Text> : null}
      </View>
      {section ? <><Text style={doc.h2}>{section.title}</Text><Text>{section.body}</Text></> : null}
    </PdfDocument>
  );
}
