// Convierte una imagen remota (logo/foto de activo) a data-URI para react-pdf (evita CORS/carga lenta).
export async function imgToDataUri(url: string): Promise<string | null> {
  try {
    const blob = await fetch(url).then((r) => r.blob());
    return await new Promise((res) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result as string);
      fr.onerror = () => res(null);
      fr.readAsDataURL(blob);
    });
  } catch { return null; }
}
