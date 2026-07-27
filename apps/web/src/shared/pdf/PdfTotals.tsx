import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { doc } from "@shared/pdf/pdf-styles";

// Bloque de totales alineado a la derecha (equivale a .totals de base.html): filas normales + gran total.
const s = StyleSheet.create({
  wrap: { marginLeft: "auto", width: 240, marginTop: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  grand: { borderTopWidth: 2, marginTop: 4, paddingTop: 6 },
});

export function PdfTotals({ rows, primaryColor }: {
  rows: { label: string; value: string; grand?: boolean }[]; primaryColor: string;
}) {
  const big = (c: string) => [doc.bold, { color: c, fontSize: 13 }];
  return (
    <View style={s.wrap}>
      {rows.map((r, i) => (
        <View key={i} style={r.grand ? [s.row, s.grand, { borderTopColor: primaryColor }] : s.row}>
          <Text style={r.grand ? big(primaryColor) : doc.muted}>{r.label}</Text>
          <Text style={r.grand ? big(primaryColor) : undefined}>{r.value}</Text>
        </View>
      ))}
    </View>
  );
}
