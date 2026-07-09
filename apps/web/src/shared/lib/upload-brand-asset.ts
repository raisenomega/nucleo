import { supabase } from "@shared/lib/supabase";

const BUCKET = "brand";
const MAX_BYTES = 500 * 1024;
const EXT: Record<string, string> = {
  "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/svg+xml": "svg",
};

export type BrandAssetResult = { ok: true; publicUrl: string } | { ok: false; error: string };
type T = (k: "fileFormatUnsupported" | "fileTooLarge") => string;

// Sube logo/favicon del tenant a brand/{tenant}/{kind}.{ext}. Valida MIME+tamaño (sin tocar Storage si falla)
// y limpia huérfanos ({kind}.* previos) para que solo quede un asset por tipo. Devuelve la URL pública.
export async function uploadBrandAsset(tenantId: string, kind: "logo" | "favicon", file: File, t?: T): Promise<BrandAssetResult> {
  const msg = (fb: string, key: "fileFormatUnsupported" | "fileTooLarge") => (t ? t(key) : fb);
  const ext = EXT[file.type];
  if (!ext) return { ok: false, error: msg("Formato no soportado. Usa PNG, JPG, WebP o SVG.", "fileFormatUnsupported") };
  if (file.size > MAX_BYTES) return { ok: false, error: msg("Archivo demasiado grande. Máximo 500 KB.", "fileTooLarge") };
  const store = supabase.storage.from(BUCKET);
  const { data: files } = await store.list(tenantId);
  const stale = ((files as { name: string }[] | null) ?? [])
    .filter((f) => f.name.startsWith(`${kind}.`))
    .map((f) => `${tenantId}/${f.name}`);
  if (stale.length) await store.remove(stale);
  const path = `${tenantId}/${kind}.${ext}`;
  const { error } = await store.upload(path, file, { upsert: true, contentType: file.type });
  if (error) return { ok: false, error: error.message };
  return { ok: true, publicUrl: store.getPublicUrl(path).data.publicUrl };
}
