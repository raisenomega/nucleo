import { Text, StyleSheet } from "@react-pdf/renderer";

// Watermark rotado, semi-transparente (equivale a .watermark de base.html). ok=verde (PAGADA/ACEPTADA), si no rojo.
const s = StyleSheet.create({
  mark: {
    position: "absolute", top: "42%", left: 0, right: 0, textAlign: "center",
    fontSize: 82, fontFamily: "Helvetica-Bold", transform: "rotate(-25deg)",
  },
});

export function PdfWatermark({ text, ok = false }: { text: string; ok?: boolean }) {
  return <Text style={[s.mark, { color: ok ? "rgba(0, 140, 60, 0.12)" : "rgba(200, 0, 0, 0.12)" }]} fixed>{text}</Text>;
}
