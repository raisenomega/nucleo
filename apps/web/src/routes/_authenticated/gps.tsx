import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { GpsFleetPage } from "@assets/presentation/GpsFleetPage";

// Monitoreo GPS de la flota. Reusa el módulo de activos (gate assets.view). Ruta fija del grupo Operaciones.
export const Route = createFileRoute("/_authenticated/gps")({ component: GpsPage });

function GpsPage() {
  const { can } = useModuleAccess();
  if (!can("assets", "view")) return <Navigate to="/dashboard" />;
  return <GpsFleetPage />;
}
