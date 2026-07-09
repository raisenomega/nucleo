import { createContext, useContext } from "react";

// Sistema de notificaciones (toasts) reutilizable. useToast().success/error/info(texto).
export type ToastKind = "success" | "error" | "info";
export type Toast = { readonly id: number; readonly kind: ToastKind; readonly text: string };
export type ToastApi = {
  success: (text: string) => void;
  error: (text: string) => void;
  info: (text: string) => void;
};

export const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de ToastProvider");
  return ctx;
}
