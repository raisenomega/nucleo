import { View, Text } from "@react-pdf/renderer";
import { PdfDocument } from "@shared/pdf/PdfDocument";
import { PdfTable } from "@shared/pdf/PdfTable";
import { PdfSignatureLine } from "@shared/pdf/PdfSignatureLine";
import { doc } from "@shared/pdf/pdf-styles";
import type { PdfBrand } from "@shared/pdf/pdf-brand";

export interface PayslipData {
  employeeName: string; period: string; grossSalary: number; netSalary: number;
  deductions: { label: string; amount: number }[]; hoursRegular?: number | null; hoursOvertime?: number | null;
}

// Recibo de pago (payslip.html). NO muestra costo patronal. Los labels vienen traducidos del caller.
export function PayslipPdf({ brand, data, labels }: {
  brand: PdfBrand; data: PayslipData;
  labels: { title: string; period: string; employee: string; concept: string; amount: string; gross: string; deductions: string; net: string; regular: string; overtime: string; signature: string; disclaimer: string };
}) {
  const money = (n: number) => `$${n.toFixed(2)}`;
  const totalDed = data.deductions.reduce((s, d) => s + d.amount, 0);
  const rows = data.deductions.map((d) => [`(−) ${d.label}`, `−${money(d.amount)}`]);
  return (
    <PdfDocument title={labels.title} brand={brand}
      meta={<><Text style={doc.docNumber}>{labels.title}</Text><Text>{labels.period}: {data.period}</Text></>}>
      <View style={doc.box}>
        <Text style={doc.bold}>{data.employeeName}</Text>
        {data.hoursRegular != null ? <Text style={doc.muted}>{labels.regular}: {data.hoursRegular}h{data.hoursOvertime ? ` · ${labels.overtime}: ${data.hoursOvertime}h` : ""}</Text> : null}
      </View>
      <PdfTable primaryColor={brand.primaryColor} headers={[labels.concept, labels.amount]} widths={[75, 25]}
        rows={[[labels.gross, money(data.grossSalary)], ...rows]}
        totals={[{ label: labels.deductions, value: `−${money(totalDed)}` }, { label: labels.net, value: money(data.netSalary), grand: true }]} />
      <PdfSignatureLine labels={[labels.signature]} />
      <Text style={[doc.muted, { marginTop: 10 }]}>{labels.disclaimer}</Text>
    </PdfDocument>
  );
}
