import { View, Text, StyleSheet } from "@react-pdf/renderer";

// Tabla reutilizable (flexbox): header con fondo color primario, zebra stripes, fila de totales opcional.
// widths = porcentajes por columna (default: equitativo). numericFrom = índice de col donde alinear a la derecha.
const s = StyleSheet.create({
  table: { marginVertical: 8 },
  head: { flexDirection: "row" },
  th: { color: "#fff", padding: 5, fontSize: 9, fontFamily: "Helvetica-Bold" },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#ddd" },
  zebra: { backgroundColor: "rgb(247, 247, 249)" },
  td: { padding: 5, fontSize: 9 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 6, paddingVertical: 3 },
  grand: { borderTopWidth: 2, marginTop: 4, paddingTop: 6, fontFamily: "Helvetica-Bold", fontSize: 12 },
});

export function PdfTable({ headers, rows, widths, primaryColor, numericFrom = 1, totals }: {
  headers: string[]; rows: (string | number)[][]; widths?: number[]; primaryColor: string;
  numericFrom?: number; totals?: { label: string; value: string | number; grand?: boolean }[];
}) {
  const w = (i: number) => ({ width: `${widths?.[i] ?? 100 / headers.length}%` } as const);
  const align = (i: number) => (i >= numericFrom ? ("right" as const) : ("left" as const));
  return (
    <View style={s.table}>
      <View style={[s.head, { backgroundColor: primaryColor }]} fixed>
        {headers.map((h, i) => <Text key={i} style={[s.th, w(i), { textAlign: align(i) }]}>{h}</Text>)}
      </View>
      {rows.map((r, ri) => (
        <View key={ri} style={ri % 2 ? [s.row, s.zebra] : s.row} wrap={false}>
          {r.map((c, ci) => <Text key={ci} style={[s.td, w(ci), { textAlign: align(ci) }]}>{String(c)}</Text>)}
        </View>
      ))}
      {totals?.map((t, i) => (
        <View key={i} style={t.grand ? [s.totalRow, s.grand, { borderTopColor: primaryColor, color: primaryColor }] : s.totalRow}>
          <Text>{t.label}</Text><Text>{String(t.value)}</Text>
        </View>
      ))}
    </View>
  );
}
