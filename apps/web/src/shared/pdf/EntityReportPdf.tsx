import { View, Text } from "@react-pdf/renderer";
import { PdfDocument } from "@shared/pdf/PdfDocument";
import { PdfKpiRow } from "@shared/pdf/PdfKpiRow";
import { PdfTable } from "@shared/pdf/PdfTable";
import { doc } from "@shared/pdf/pdf-styles";
import type { PdfBrand } from "@shared/pdf/pdf-brand";
import type { ReconSection } from "@shared/pdf/ReconciliationPdf";

// Dossier genérico de entidad: caja de datos (2 col) + notas + secciones (kpi|table). Sirve al reporte de cliente.
export interface EntityData {
  title: string; infoRows: { label: string; value: string }[];
  notes?: string | null; notesLabel?: string; sections: ReconSection[];
}

export function EntityReportPdf({ data, brand }: { data: EntityData; brand: PdfBrand }) {
  return (
    <PdfDocument title={data.title} brand={brand} meta={<Text style={doc.docNumber}>{data.title.toUpperCase()}</Text>}>
      <View style={[doc.box, { flexDirection: "row", flexWrap: "wrap" }]}>
        {data.infoRows.map((r, i) => (
          <View key={i} style={{ width: "50%", flexDirection: "row", paddingVertical: 2 }}>
            <Text style={[doc.muted, { width: "40%" }]}>{r.label}</Text><Text>{r.value}</Text>
          </View>
        ))}
      </View>
      {data.notes ? <><Text style={doc.h2}>{data.notesLabel}</Text><Text style={doc.muted}>{data.notes}</Text></> : null}
      {data.sections.map((s, i) => s.kind === "kpi"
        ? <PdfKpiRow key={i} kpis={s.kpis} primaryColor={brand.primaryColor} />
        : <View key={i}><Text style={doc.h2}>{s.title}</Text>
            <PdfTable primaryColor={brand.primaryColor} headers={s.headers} rows={s.rows} numericFrom={1} /></View>)}
    </PdfDocument>
  );
}
