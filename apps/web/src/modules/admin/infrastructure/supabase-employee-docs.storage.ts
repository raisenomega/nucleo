import { supabase } from "@shared/lib/supabase";

const BUCKET = "employee-docs";

// Mismo patrón que supabase-evidence.storage, bucket employee-docs. Ruta: {tenantId}/{uuid}/{archivo}.
export async function uploadEmployeeDoc(tenantId: string, file: File): Promise<string | null> {
  const safe = file.name.replace(/[^\w.-]/g, "_");
  const path = `${tenantId}/${crypto.randomUUID()}/${safe}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file);
  return error ? null : path;
}

export async function signEmployeeDoc(path: string): Promise<string | null> {
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export async function removeEmployeeDoc(path: string): Promise<void> {
  await supabase.storage.from(BUCKET).remove([path]);
}
