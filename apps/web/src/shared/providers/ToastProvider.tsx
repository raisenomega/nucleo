import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { ToastContext, type Toast, type ToastKind } from "@shared/providers/toast-context";
import { ToastStack } from "@shared/components/ToastStack";

// Mantiene la pila de toasts, auto-descarta a los 4s y renderiza el stack flotante.
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);
  const remove = useCallback((id: number) => setToasts((ts) => ts.filter((t) => t.id !== id)), []);
  const push = useCallback((kind: ToastKind, text: string) => {
    const id = (seq.current += 1);
    setToasts((ts) => [...ts, { id, kind, text }]);
    setTimeout(() => remove(id), 4000);
  }, [remove]);
  const api = useMemo(() => ({
    success: (text: string) => push("success", text),
    error: (text: string) => push("error", text),
    info: (text: string) => push("info", text),
  }), [push]);
  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastStack toasts={toasts} onDismiss={remove} />
    </ToastContext.Provider>
  );
}
