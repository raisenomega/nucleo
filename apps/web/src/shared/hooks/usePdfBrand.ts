import { useEffect, useState } from "react";
import { useBrand } from "@shared/providers/brand-context";
import { DEFAULT_PDF_COLORS, type PdfBrand } from "@shared/pdf/pdf-brand";

// Logo → data-URI (evita CORS/carga lenta del remoto en react-pdf). Cacheado por sesión (el logo no cambia).
async function toDataUri(url: string): Promise<string | null> {
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

// Marca white-label lista para los PDFs (nombre + logo data-URI + colores). Lee del BrandProvider ya cargado.
export function usePdfBrand(): PdfBrand {
  const brand = useBrand();
  const [logo, setLogo] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    if (brand.logoUrl) void toDataUri(brand.logoUrl).then((d) => { if (alive) setLogo(d); });
    else setLogo(null);
    return () => { alive = false; };
  }, [brand.logoUrl]);
  return {
    name: brand.displayName || brand.legalName || "NÚCLEO",
    logo,
    primaryColor: brand.theme.primaryColor || DEFAULT_PDF_COLORS.primary,
    accentColor: brand.theme.accentColor || DEFAULT_PDF_COLORS.accent,
  };
}
