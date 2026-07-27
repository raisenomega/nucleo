import { StyleSheet } from "@react-pdf/renderer";

// Estilos base del documento (page/header/footer/box) — espejo de base.html. Cada componente añade lo suyo.
// El tipo PdfBrand y los colores default viven en pdf-brand.ts (sin react-pdf → SSR-safe).
export const doc = StyleSheet.create({
  page: { paddingTop: 30, paddingBottom: 42, paddingHorizontal: 34, fontFamily: "Helvetica", fontSize: 10, color: "#222" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 3, paddingBottom: 10, marginBottom: 16 },
  brandRow: { flexDirection: "row", alignItems: "center" },
  logo: { height: 40, width: 40, objectFit: "contain", marginRight: 10 },
  h1: { fontSize: 16, fontFamily: "Helvetica-Bold" },
  meta: { textAlign: "right", fontSize: 9, color: "#666" },
  docNumber: { fontSize: 13, fontFamily: "Helvetica-Bold" },
  footer: { position: "absolute", bottom: 20, left: 34, right: 34, flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: "#888" },
  box: { borderWidth: 1, borderColor: "#ddd", borderRadius: 6, padding: 10, marginVertical: 6 },
  h2: { fontSize: 12, fontFamily: "Helvetica-Bold", marginTop: 12, marginBottom: 5 },
  muted: { fontSize: 9, color: "#666" },
  bold: { fontFamily: "Helvetica-Bold" },
});
