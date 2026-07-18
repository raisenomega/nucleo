import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { signEvidence } from "@finance/infrastructure/supabase-evidence.storage";

// Firma rutas del bucket privado y muestra miniaturas. Fallback ícono Package (tamaño sm) si no hay fotos.
export function SignedPhotos({ paths, size = "sm" }: { paths: readonly string[]; size?: "sm" | "lg" }) {
  const [urls, setUrls] = useState<string[]>([]);
  useEffect(() => { if (!paths.length) { setUrls([]); return; } void signEvidence(paths).then(setUrls); }, [paths]);
  if (!paths.length) return size === "sm" ? <Package className="h-6 w-6 shrink-0 text-muted-foreground" /> : null;
  const cls = size === "lg" ? "h-20 w-20" : "h-6 w-6";
  return <span className="inline-flex gap-1">{urls.map((u, i) => <img key={i} src={u} alt="" className={`${cls} shrink-0 rounded-md border border-border object-cover`} />)}</span>;
}
