// Redimensiona a maxW (manteniendo aspecto) y exporta JPEG q0.8. Baja fotos de cámara de ~5-8MB a ~200-400KB
// para no saturar la subida en campo (señal móvil). Si el canvas falla, devuelve el archivo original.
export async function compressImage(file: File, maxW = 1200, quality = 0.8): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, maxW / bmp.width);
    const w = Math.round(bmp.width * scale);
    const h = Math.round(bmp.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) { bmp.close(); return file; }
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close();
    return await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b ?? file), "image/jpeg", quality));
  } catch {
    return file;
  }
}
