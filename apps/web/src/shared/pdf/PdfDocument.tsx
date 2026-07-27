import type { ReactNode } from "react";
import { Document, Page, View, Text, Image } from "@react-pdf/renderer";
import { doc } from "@shared/pdf/pdf-styles";
import type { PdfBrand } from "@shared/pdf/pdf-brand";

// Wrapper base (equivale a base.html): header white-label fijo (logo + nombre, borde color primario)
// + footer paginado con fecha de generación. `meta` = bloque superior derecho (número de doc, fecha…).
export function PdfDocument({ title, meta, brand, children }: {
  title: string; meta?: ReactNode; brand: PdfBrand; children: ReactNode;
}) {
  const generatedAt = new Date().toLocaleDateString("es", { year: "numeric", month: "2-digit", day: "2-digit" });
  return (
    <Document title={title}>
      <Page size="A4" style={doc.page}>
        <View style={[doc.header, { borderBottomColor: brand.primaryColor }]} fixed>
          <View style={doc.brandRow}>
            {brand.logo ? <Image style={doc.logo} src={brand.logo} /> : null}
            <Text style={[doc.h1, { color: brand.primaryColor }]}>{brand.name || "NÚCLEO"}</Text>
          </View>
          <View style={doc.meta}>{meta}</View>
        </View>
        {children}
        <View style={doc.footer} fixed>
          <Text>{generatedAt}</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
