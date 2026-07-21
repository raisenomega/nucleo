// Normaliza CUALQUIER foto de cámara a JPEG ≤maxW listo para subir. Robusto multi-dispositivo:
// los iPhone (y varios Android nuevos) entregan HEIC, que Chrome/Android no decodifica; y la orientación
// EXIF se aplica (o no) según navegador. Antes, si el decode fallaba se subía el ORIGINAL etiquetado como
// .jpg → miniaturas rotas "solo en algunos celulares". Regla de oro ahora: lo que sale de aquí es SIEMPRE
// JPEG re-renderizado (orientación ya horneada), o un original que ya era formato web-safe, o null (el
// caller avisa). Nunca un HEIC disfrazado.
const WEB_SAFE = new Set(["image/jpeg", "image/png", "image/webp"]);

// Decoder 1: createImageBitmap con EXIF explícito ("from-image" NO es default en todos los navegadores).
// Algunos Safari viejos lanzan si se pasan opciones → reintento sin opciones antes de rendirse.
async function decodeBitmap(file: File): Promise<ImageBitmap> {
  try { return await createImageBitmap(file, { imageOrientation: "from-image" }); }
  catch { return await createImageBitmap(file); }
}

// Decoder 2 (fallback): <img> + objectURL. Decodifica HEIC donde el SO sabe (iOS/Safari) y los navegadores
// modernos aplican EXIF por defecto al pintar <img> (CSS image-orientation: from-image).
function decodeImg(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("img decode failed")); };
    img.src = url;
  });
}

function toJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((b) => {
      if (b) return resolve(b);
      try { // Safari raro: toBlob null → vía dataURL
        const parts = atob(canvas.toDataURL("image/jpeg", quality).split(",")[1] ?? "");
        const bytes = Uint8Array.from(parts, (c) => c.charCodeAt(0));
        resolve(new Blob([bytes], { type: "image/jpeg" }));
      } catch { resolve(null); }
    }, "image/jpeg", quality);
  });
}

export async function compressImage(file: File, maxW = 1200, quality = 0.8): Promise<Blob | null> {
  let source: ImageBitmap | HTMLImageElement | null = null;
  try { source = await decodeBitmap(file); } catch { /* probamos el decoder 2 */ }
  if (!source) { try { source = await decodeImg(file); } catch { /* sin decode posible */ } }
  if (!source) return WEB_SAFE.has(file.type) ? file : null; // JPEG/PNG/WebP original ok; HEIC jamás

  const sw = "naturalWidth" in source ? source.naturalWidth : source.width;
  const sh = "naturalHeight" in source ? source.naturalHeight : source.height;
  const scale = Math.min(1, maxW / sw);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(sw * scale));
  canvas.height = Math.max(1, Math.round(sh * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return WEB_SAFE.has(file.type) ? file : null;
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  if ("close" in source) source.close();

  const jpeg = await toJpeg(canvas, quality);
  if (jpeg) return jpeg;
  return WEB_SAFE.has(file.type) ? file : null;
}
