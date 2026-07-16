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

// Sube una foto de evidencia de parada (ya comprimida) a una ruta determinista por fase. upsert = reintento seguro.
// Path: {tenant}/routes/{route}/{stop}/{phase}_{uuid}.jpg. Devuelve la ruta guardable o null si falló.
export async function uploadStopPhoto(tenantId: string, routeId: string, stopId: string, phase: string, blob: Blob): Promise<string | null> {
  const path = `${tenantId}/routes/${routeId}/${stopId}/${phase}_${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: "image/jpeg", upsert: true });
  return error ? null : path;
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
