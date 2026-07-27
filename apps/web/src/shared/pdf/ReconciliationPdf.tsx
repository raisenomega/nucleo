import { View, Text } from "@react-pdf/renderer";
import { PdfDocument } from "@shared/pdf/PdfDocument";
import { PdfKpiRow } from "@shared/pdf/PdfKpiRow";
import { PdfTable } from "@shared/pdf/PdfTable";
import { doc } from "@shared/pdf/pdf-styles";
import type { PdfBrand } from "@shared/pdf/pdf-brand";

// Reporte fiscal (reconciliation.html): 6 secciones = KPIs o tablas. El loader arma `sections` desde el
// snapshot completo (bank/tax/retention/summary/health) que el front ya construye.
export type ReconSection =
  | { kind: "kpi"; kpis: { label: string; value: string | number }[] }
  | { kind: "table"; title: string; headers: string[]; rows: (string | number)[][] };
export interface ReconData { title: string; sections: ReconSection[] }

export function ReconciliationPdf({ data, brand }: { data: ReconData; brand: PdfBrand }) {
  return (
    <PdfDocument title={data.title} brand={brand} meta={<Text style={doc.docNumber}>{data.title.toUpperCase()}</Text>}>
      {data.sections.map((s, i) => s.kind === "kpi"
        ? <PdfKpiRow key={i} kpis={s.kpis} primaryColor={brand.primaryColor} />
        : (
          <View key={i}>
            <Text style={doc.h2}>{s.title}</Text>
            <PdfTable primaryColor={brand.primaryColor} headers={s.headers} rows={s.rows} numericFrom={1} />
          </View>
        ))}
    </PdfDocument>
  );
}
