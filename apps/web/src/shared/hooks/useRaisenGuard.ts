import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { isRaisenHost } from "@shared/lib/brand-host";

// D2: las rutas del producto Raisen (home, registro, agendar-consulta) solo viven en dominios
// operacionales. En un dominio de tenant redirigen a /login.
export function useRaisenGuard(): void {
  const nav = useNavigate();
  useEffect(() => {
    if (!isRaisenHost()) void nav({ to: "/login" });
  }, [nav]);
}
