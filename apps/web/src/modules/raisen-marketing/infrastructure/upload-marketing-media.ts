import { supabase } from "@shared/lib/supabase";

const BUCKET = "marketing-media";
const LIMITS = { video: 50 * 1024 * 1024, image: 25 * 1024 * 1024, avatar: 5 * 1024 * 1024 };
const FOLDER = { video: "hero", image: "hero", avatar: "avatars" };
const EXT: Record<string, string> = { "video/mp4": "mp4", "video/webm": "webm", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
export type UploadKind = "video" | "image" | "avatar";

export type UploadResult = { ok: true; url: string } | { ok: false; error: string };

// Sube un archivo de marketing (hero video/imagen o avatar) a marketing-media. Valida MIME+tamaño (RLS del
// bucket exige is_superadmin). Nombre único por timestamp → evita cache stale. Upload inmediato al seleccionar.
export async function uploadMarketingMedia(kind: UploadKind, file: File): Promise<UploadResult> {
  const ext = EXT[file.type];
  const okType = kind === "video" ? file.type.startsWith("video/") : file.type.startsWith("image/");
  if (!ext || !okType) return { ok: false, error: kind === "video" ? "Usa MP4 o WebM." : "Usa JPG, PNG o WebP." };
  if (file.size > LIMITS[kind]) return { ok: false, error: `Máximo ${LIMITS[kind] / 1024 / 1024} MB.` };
  const store = supabase.storage.from(BUCKET);
  const path = `${FOLDER[kind]}/${kind}-${Date.now()}.${ext}`;
  const { error } = await store.upload(path, file, { upsert: true, contentType: file.type });
  if (error) return { ok: false, error: error.message };
  return { ok: true, url: store.getPublicUrl(path).data.publicUrl };
}
