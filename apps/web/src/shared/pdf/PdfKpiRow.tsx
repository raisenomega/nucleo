import { View, Text, StyleSheet } from "@react-pdf/renderer";

// Fila de KPIs (boxes horizontales con borde) — equivale a .kpis/.kpi de report.html/reconciliation.html.
const s = StyleSheet.create({
  row: { flexDirection: "row", marginVertical: 8 },
  kpi: { flex: 1, borderWidth: 1, borderColor: "#ddd", borderRadius: 6, padding: 8, marginRight: 6, alignItems: "center" },
  val: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  lbl: { fontSize: 8, color: "#666", textTransform: "uppercase", marginTop: 2 },
});

export function PdfKpiRow({ kpis, primaryColor }: {
  kpis: { label: string; value: string | number }[]; primaryColor: string;
}) {
  return (
    <View style={s.row}>
      {kpis.map((k, i) => (
        <View key={i} style={i === kpis.length - 1 ? [s.kpi, { marginRight: 0 }] : s.kpi}>
          <Text style={[s.val, { color: primaryColor }]}>{String(k.value)}</Text>
          <Text style={s.lbl}>{k.label}</Text>
        </View>
      ))}
    </View>
  );
}
