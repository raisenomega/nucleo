import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

// Sección colapsable del editor con contador opcional (ej: "Casos de uso (6)").
export function Section({ title, count, children }: { title: string; count?: number; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-border">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between p-4 font-semibold text-foreground">
        <span>{title}{count !== undefined ? ` (${count})` : ""}</span>
        <ChevronDown className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="space-y-3 border-t border-border p-4">{children}</div>}
    </div>
  );
}
