import { LineChart, type LucideIcon } from "lucide-react";

// Estado vacío honesto para gráficas: cuando no hay datos suficientes para dibujar (ej. tenant nuevo
// con <2 meses de historial) o cuando el vacío es una buena noticia (sin cuentas pendientes).
export function EmptyChartState({ message, variant = "neutral", icon: Icon = LineChart }: {
  message: string; variant?: "neutral" | "positive"; icon?: LucideIcon;
}) {
  const positive = variant === "positive";
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card p-6 text-center">
      <Icon className={`h-8 w-8 ${positive ? "text-emerald-500" : "text-muted-foreground/50"}`} />
      <p className={`max-w-xs text-sm ${positive ? "text-emerald-600" : "text-muted-foreground"}`}>{message}</p>
    </div>
  );
}
