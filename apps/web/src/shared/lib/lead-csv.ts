// R6 · export de leads a CSV en el CLIENTE (sin backend). Sirve para subir a Meta/Google (audiencias similares)
// o pasar a un CRM externo. BOM UTF-8 para que Excel abra bien los acentos.
export interface LeadCsvRow {
  date: string; name: string; email: string; phone: string; campaign: string;
  utmSource: string; utmMedium: string; utmCampaign: string; fbclid: string; gclid: string; status: string;
}
const HEAD = ["fecha", "nombre", "email", "telefono", "campana", "utm_source", "utm_medium", "utm_campaign", "fbclid", "gclid", "status"];
const esc = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;

export function downloadLeadsCsv(rows: LeadCsvRow[], filename: string): void {
  const body = rows.map((r) => [r.date, r.name, r.email, r.phone, r.campaign, r.utmSource, r.utmMedium, r.utmCampaign, r.fbclid, r.gclid, r.status].map(esc).join(","));
  const blob = new Blob(["﻿" + [HEAD.join(","), ...body].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
