import { View, Text, Image } from "@react-pdf/renderer";
import { PdfDocument } from "@shared/pdf/PdfDocument";
import { PdfSignatureLine } from "@shared/pdf/PdfSignatureLine";
import { doc } from "@shared/pdf/pdf-styles";
import type { PdfBrand } from "@shared/pdf/pdf-brand";

// Comprobante de servicio completado (fotos antes/después como data-URIs, 2 por fila). Labels ya traducidos.
export interface ServiceCompletionData {
  date: string; address: string; customerName: string; serviceType: string;
  notes: string | null; completedBy: string;
}
export interface ServicePhotos { before: string[]; after: string[] }

function PhotoGrid({ urls }: { urls: string[] }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
      {urls.map((u, i) => <Image key={i} src={u} style={{ width: 230, height: 155, objectFit: "cover", borderRadius: 4 }} />)}
    </View>
  );
}

export function ServiceCompletionPdf({ data, photos, brand, labels }: {
  data: ServiceCompletionData; photos?: ServicePhotos; brand: PdfBrand;
  labels: { title: string; customer: string; service: string; date: string; notes: string; before: string; after: string; completedBy: string };
}) {
  const line = (k: string, v: string) => (v ? <View style={{ flexDirection: "row", paddingVertical: 1 }}><Text style={[doc.muted, { width: "30%" }]}>{k}</Text><Text>{v}</Text></View> : null);
  return (
    <PdfDocument title={labels.title} brand={brand} meta={<Text style={doc.docNumber}>{labels.title}</Text>}>
      <View style={doc.box}>
        {line(labels.customer, data.customerName)}{line(labels.service, data.serviceType)}
        {line(labels.date, data.date)}{line("", data.address)}
      </View>
      {data.notes ? <><Text style={doc.h2}>{labels.notes}</Text><Text style={doc.muted}>{data.notes}</Text></> : null}
      {photos?.before.length ? <><Text style={doc.h2}>{labels.before}</Text><PhotoGrid urls={photos.before} /></> : null}
      {photos?.after.length ? <><Text style={doc.h2}>{labels.after}</Text><PhotoGrid urls={photos.after} /></> : null}
      <PdfSignatureLine labels={[`${labels.completedBy}: ${data.completedBy}`]} />
    </PdfDocument>
  );
}
