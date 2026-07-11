import { Lightbulb } from "lucide-react";

// Leyenda de análisis automático (lógica simple, no IA).
export function ReportLegend({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="flex gap-2 rounded-lg bg-secondary p-3 text-sm">
      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
      <p className="text-muted-foreground">{text}</p>
    </div>
  );
}
