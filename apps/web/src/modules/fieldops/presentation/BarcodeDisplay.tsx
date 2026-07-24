import { useEffect, useRef } from "react";

// Renderiza un código de barras como SVG inline con jsbarcode (MIT, lazy-load → no pesa el bundle principal).
// Cliente-only (escribe en el DOM del <svg>). Si el valor no es válido para el formato, no renderiza (catch).
export function BarcodeDisplay({ value, format = "CODE128" }: { value: string; format?: "CODE128" | "EAN13" | "UPC" }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    let cancel = false;
    void import("jsbarcode").then(({ default: JsBarcode }) => {
      if (cancel || !ref.current) return;
      try { JsBarcode(ref.current, value, { format, width: 2, height: 60, fontSize: 14, margin: 8, displayValue: true }); }
      catch { /* valor inválido para el formato elegido → svg vacío */ }
    });
    return () => { cancel = true; };
  }, [value, format]);
  return <svg ref={ref} className="mx-auto max-w-full" role="img" aria-label={value} />;
}
