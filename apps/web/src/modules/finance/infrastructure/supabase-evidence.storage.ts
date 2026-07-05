import { supabase } from "@shared/lib/supabase";

const BUCKET = "evidence";

// Sube fotos al bucket privado. Ruta: {tenantId}/{uuid}/{archivo}. Devuelve las rutas guardables.
export async function uploadEvidence(tenantId: string, files: File[]): Promise<string[]> {
  const paths: string[] = [];
  for (const file of files) {
    const safe = file.name.replace(/[^\w.-]/g, "_");
    const path = `${tenantId}/${crypto.randomUUID()}/${safe}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file);
    if (!error) paths.push(path);
  }
  return paths;
}

// Firma URLs temporales (1h) para mostrar la evidencia sin exponer el bucket.
export async function signEvidence(paths: readonly string[]): Promise<string[]> {
  const urls: string[] = [];
  for (const p of paths) {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(p, 3600);
    if (data?.signedUrl) urls.push(data.signedUrl);
  }
  return urls;
}

export async function removeEvidence(paths: readonly string[]): Promise<void> {
  if (paths.length) await supabase.storage.from(BUCKET).remove([...paths]);
}
