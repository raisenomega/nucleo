import { Loader2 } from "lucide-react";

const SIZE = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-6 w-6" };

// Spinner presentacional (wrap de Loader2). El consumidor decide el contenedor. label = aria-label.
export function Spinner({ size = "md", className = "", label = "Cargando…" }: {
  size?: "sm" | "md" | "lg"; className?: string; label?: string;
}) {
  return <Loader2 role="status" aria-label={label} className={`animate-spin ${SIZE[size]} ${className}`} />;
}
