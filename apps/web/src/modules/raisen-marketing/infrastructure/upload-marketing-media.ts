import { supabase } from "@shared/lib/supabase";

const BUCKET = "marketing-media";
const LIMITS = { video: 50 * 1024 * 1024, image: 25 * 1024 * 1024 };
const EXT: Record<string, string> = { "video/mp4": "mp4", "video/webm": "webm", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export type UploadResult = { ok: true; url: string } | { ok: false; error: string };

// Sube un archivo del hero (video/imagen) a marketing-media. Valida MIME+tamaño (RLS del bucket exige
// is_superadmin). Nombre único por timestamp → evita cache stale. Upload inmediato (al seleccionar el archivo).
export async function uploadMarketingMedia(kind: "video" | "image", file: File): Promise<UploadResult> {
  const ext = EXT[file.type];
  const okType = kind === "video" ? file.type.startsWith("video/") : file.type.startsWith("image/");
  if (!ext || !okType) return { ok: false, error: kind === "video" ? "Usa MP4 o WebM." : "Usa JPG, PNG o WebP." };
  if (file.size > LIMITS[kind]) return { ok: false, error: kind === "video" ? "Máximo 50 MB." : "Máximo 25 MB." };
  const store = supabase.storage.from(BUCKET);
  const path = `hero/${kind}-${Date.now()}.${ext}`;
  const { error } = await store.upload(path, file, { upsert: true, contentType: file.type });
  if (error) return { ok: false, error: error.message };
  return { ok: true, url: store.getPublicUrl(path).data.publicUrl };
}
