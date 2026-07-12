import { Inbox } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

const SZ = {
  sm: { icon: "h-8 w-8", pad: "py-8", title: "text-sm" },
  md: { icon: "h-12 w-12", pad: "py-12", title: "text-base" },
  lg: { icon: "h-16 w-16", pad: "py-16", title: "text-lg" },
};

// Estado vacío centrado: icono + título (requerido, ya traducido por el consumidor) + descripción + slot CTA.
export function EmptyState({ icon: Icon = Inbox, title, description, size = "md", children }: {
  icon?: LucideIcon; title: string; description?: string; size?: "sm" | "md" | "lg"; children?: ReactNode;
}) {
  const s = SZ[size];
  return (
    <div role="status" aria-live="polite" className={`mx-auto flex max-w-md flex-col items-center px-4 text-center ${s.pad}`}>
      <Icon className={`${s.icon} text-muted-foreground`} aria-hidden="true" />
      <h3 className={`mt-3 font-semibold text-foreground ${s.title}`}>{title}</h3>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
