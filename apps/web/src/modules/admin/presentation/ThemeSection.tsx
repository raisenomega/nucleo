import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

// Sección colapsable (acordeón) para /settings/temas.
export function ThemeSection({ title, open, onToggle, children }: {
  title: string; open: boolean; onToggle: () => void; children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <button type="button" onClick={onToggle}
        className="flex w-full items-center justify-between p-4 text-left font-body font-bold text-primary">
        {title} <ChevronDown className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="space-y-4 border-t border-border p-4">{children}</div>}
    </div>
  );
}
