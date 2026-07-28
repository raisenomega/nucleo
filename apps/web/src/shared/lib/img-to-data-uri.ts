// Convierte una imagen remota (logo/foto de activo) a data-URI para react-pdf (evita CORS/carga lenta).
// SVG → null: el <Image> de react-pdf NO soporta SVG y lanzaría, rompiendo TODO el PDF (degrada a solo-nombre).
export async function imgToDataUri(url: string): Promise<string | null> {
  try {
    const blob = await fetch(url).then((r) => r.blob());
    if (blob.type.includes("svg") || /\.svg(\?|$)/i.test(url)) return null;
    return await new Promise((res) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result as string);
      fr.onerror = () => res(null);
      fr.readAsDataURL(blob);
    });
  } catch { return null; }
}
