import { supabase } from "@shared/lib/supabase";

// pdf-api (Railway) genera+sube el PDF y devuelve una signed URL de 1h. Para el mensaje de
// WhatsApp necesitamos una URL de larga vida: descargamos el blob y lo re-subimos a tenant-pdfs
// bajo {tenant}/quote/... (RLS exige foldername[1]=tenant), firmando a 7 días.
const API: string = import.meta.env.VITE_PDF_API_URL ?? "https://nucleo-production-ab48.up.railway.app";

export async function uploadQuotePdf(tenantId: string, quoteId: string): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return null;
  const res = await fetch(`${API}/pdf/quote/${quoteId}`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: "{}",
  });
  if (!res.ok) return null;
  const { url } = (await res.json()) as { url: string };
  if (!url) return null;
  const blob = await fetch(url).then((r) => r.blob());
  const path = `${tenantId}/quote/${quoteId}-${Date.now()}.pdf`;
  const up = await supabase.storage.from("tenant-pdfs").upload(path, blob, { contentType: "application/pdf", upsert: true });
  if (up.error) return null;
  const signed = await supabase.storage.from("tenant-pdfs").createSignedUrl(path, 7 * 24 * 3600);
  return signed.data?.signedUrl ?? null;
}
