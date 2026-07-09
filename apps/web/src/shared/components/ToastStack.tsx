import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import type { Toast, ToastKind } from "@shared/providers/toast-context";

// Presentación de la pila de toasts (esquina inferior derecha). Color + icono por tipo.
const STYLE: Record<ToastKind, { icon: typeof Info; cls: string }> = {
  success: { icon: CheckCircle2, cls: "border-green-600 text-green-700" },
  error: { icon: AlertCircle, cls: "border-destructive text-destructive" },
  info: { icon: Info, cls: "border-primary text-primary" },
};

export function ToastStack({ toasts, onDismiss }: { toasts: readonly Toast[]; onDismiss: (id: number) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => {
        const s = STYLE[t.kind];
        const Icon = s.icon;
        return (
          <div key={t.id} role="status"
            className={`flex items-center gap-2 rounded-lg border-l-4 bg-card px-4 py-3 text-sm font-medium shadow-lg ${s.cls}`}>
            <Icon className="h-4 w-4 shrink-0" />
            <span className="text-foreground">{t.text}</span>
            <button type="button" onClick={() => onDismiss(t.id)} aria-label="cerrar" className="ml-2 text-muted-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
