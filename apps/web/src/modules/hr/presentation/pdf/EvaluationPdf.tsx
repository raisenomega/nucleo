import { View, Text } from "@react-pdf/renderer";
import { PdfDocument } from "@shared/pdf/PdfDocument";
import { PdfTable } from "@shared/pdf/PdfTable";
import { doc } from "@shared/pdf/pdf-styles";
import type { PdfBrand } from "@shared/pdf/pdf-brand";

export interface EvaluationPdfData {
  employeeName: string; period: string; compositeScore: number; classification: string;
  inProbation: boolean; requiresLegal: boolean; notes: string | null;
  scores: { label: string; score: number }[];
}

// Evaluación de desempeño (evaluation.html): score compuesto grande + tabla de criterios + aviso Ley 80 + notas.
export function EvaluationPdf({ brand, data, labels }: {
  brand: PdfBrand; data: EvaluationPdfData;
  labels: { title: string; period: string; probation: string; criterion: string; score: string; legalTitle: string; legalBody: string; notes: string };
}) {
  return (
    <PdfDocument title={labels.title} brand={brand}
      meta={<><Text style={doc.docNumber}>{labels.title}</Text><Text>{labels.period}: {data.period}</Text></>}>
      <View style={doc.box}>
        <Text style={doc.bold}>{data.employeeName}</Text>
        {data.inProbation ? <Text style={doc.muted}>{labels.probation}</Text> : null}
      </View>
      <View style={[doc.box, { alignItems: "center" }]}>
        <Text style={{ fontSize: 26, fontFamily: "Helvetica-Bold", color: brand.primaryColor }}>{data.compositeScore.toFixed(2)}</Text>
        <Text style={{ fontSize: 11, textTransform: "uppercase" }}>{data.classification}</Text>
      </View>
      <PdfTable primaryColor={brand.primaryColor} headers={[labels.criterion, labels.score]} widths={[75, 25]}
        rows={data.scores.map((c) => [c.label, c.score.toFixed(2)])} />
      {data.requiresLegal ? (
        <View style={[doc.box, { borderColor: "#c00" }]}>
          <Text style={[doc.bold, { color: "#c00" }]}>{labels.legalTitle}</Text>
          <Text style={doc.muted}>{labels.legalBody}</Text>
        </View>
      ) : null}
      {data.notes ? <><Text style={doc.h2}>{labels.notes}</Text><Text>{data.notes}</Text></> : null}
    </PdfDocument>
  );
}
