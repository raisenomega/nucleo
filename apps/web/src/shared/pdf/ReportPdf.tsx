import { View, Text } from "@react-pdf/renderer";
import { PdfDocument } from "@shared/pdf/PdfDocument";
import { PdfKpiRow } from "@shared/pdf/PdfKpiRow";
import { PdfTable } from "@shared/pdf/PdfTable";
import { doc } from "@shared/pdf/pdf-styles";
import type { PdfBrand } from "@shared/pdf/pdf-brand";

// Reporte genérico (report.html): KPIs + N tablas. `charts` se ignora (código muerto confirmado por la
// auditoría). Un solo componente cubre reports/inventory/assets/AR/finance — el front ya arma el body.
export interface ReportBody {
  title: string; date_from?: string; date_to?: string;
  kpis: { label: string; value: string | number }[];
  tables: { title: string; headers: string[]; rows: (string | number)[][]; totals?: { label: string; value: string | number }[] }[];
  charts?: unknown[];
}

export function ReportPdf({ body, brand }: { body: ReportBody; brand: PdfBrand }) {
  const range = [body.date_from, body.date_to].filter(Boolean).join(" → ");
  return (
    <PdfDocument title={body.title} brand={brand}
      meta={<><Text style={doc.docNumber}>{body.title.toUpperCase()}</Text>{range ? <Text>{range}</Text> : null}</>}>
      {body.kpis.length > 0 ? <PdfKpiRow kpis={body.kpis} primaryColor={brand.primaryColor} /> : null}
      {body.tables.map((tbl, i) => (
        <View key={i}>
          <Text style={doc.h2}>{tbl.title}</Text>
          <PdfTable primaryColor={brand.primaryColor} headers={tbl.headers} rows={tbl.rows} numericFrom={tbl.headers.length}
            totals={tbl.totals?.map((tt) => ({ ...tt, grand: true }))} />
        </View>
      ))}
    </PdfDocument>
  );
}
