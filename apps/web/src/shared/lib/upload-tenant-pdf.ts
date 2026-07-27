import { supabase } from "@shared/lib/supabase";

// Sube un blob PDF a tenant-pdfs bajo {tenant}/{subpath} y devuelve una signed URL de 7 días.
// RLS del bucket exige foldername[1]=tenant. Reutilizado por cotización/factura/orden/cliente/servicio.
export async function uploadTenantPdf(tenantId: string, subpath: string, blob: Blob): Promise<string | null> {
  const path = `${tenantId}/${subpath}`;
  const up = await supabase.storage.from("tenant-pdfs").upload(path, blob, { contentType: "application/pdf", upsert: true });
  if (up.error) return null;
  const signed = await supabase.storage.from("tenant-pdfs").createSignedUrl(path, 7 * 24 * 3600);
  return signed.data?.signedUrl ?? null;
}
