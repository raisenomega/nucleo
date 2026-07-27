import { View, Text, StyleSheet } from "@react-pdf/renderer";

// Línea(s) de firma (equivale a .sig de base.html / los bloques de firma de custody). label por columna.
const s = StyleSheet.create({
  wrap: { flexDirection: "row", justifyContent: "center", marginTop: 56 },
  col: { marginHorizontal: 20, alignItems: "center" },
  line: { borderTopWidth: 1, borderTopColor: "#444", width: 220, paddingTop: 6 },
  label: { fontSize: 9, color: "#666", textAlign: "center" },
});

export function PdfSignatureLine({ labels }: { labels: string[] }) {
  return (
    <View style={s.wrap}>
      {labels.map((l, i) => (
        <View key={i} style={s.col}>
          <View style={s.line}><Text style={s.label}>{l}</Text></View>
        </View>
      ))}
    </View>
  );
}
