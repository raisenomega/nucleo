import { useEffect, useState } from "react";
import { useBrand } from "@shared/providers/brand-context";
import { imgToDataUri } from "@shared/lib/img-to-data-uri";
import { DEFAULT_PDF_COLORS, type PdfBrand } from "@shared/pdf/pdf-brand";

// Marca white-label lista para los PDFs (nombre + logo data-URI + colores). Lee del BrandProvider ya cargado.
export function usePdfBrand(): PdfBrand {
  const brand = useBrand();
  const [logo, setLogo] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    if (brand.logoUrl) void imgToDataUri(brand.logoUrl).then((d) => { if (alive) setLogo(d); });
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
