import { supabase } from "@shared/lib/supabase";

const BUCKET = "evidence";

// Sube una foto de artículo (ya comprimida) al bucket privado. Path: {tenant}/inventory/{item}/photo_{uuid}.jpg.
export async function uploadItemPhoto(tenantId: string, itemId: string, blob: Blob): Promise<string | null> {
  const path = `${tenantId}/inventory/${itemId}/photo_${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: "image/jpeg", upsert: true });
  return error ? null : path;
}

// Persistencia inmediata de las rutas en inventory_items (no espera al botón Guardar del form).
export async function persistItemPhotos(itemId: string, paths: string[]): Promise<void> {
  await supabase.from("inventory_items").update({ photo_urls: paths }).eq("id", itemId);
}
