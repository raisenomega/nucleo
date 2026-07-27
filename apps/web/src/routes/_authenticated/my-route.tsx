import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { DriverView } from "@operations/presentation/DriverView";

// Driver-view: "Mi ruta de hoy" para el rol servicio (y cualquiera con ruta asignada). Gate routes.view.
export const Route = createFileRoute("/_authenticated/my-route")({ component: MyRoutePage });

function MyRoutePage() {
  const { can } = useModuleAccess();
  if (!can("routes", "view")) return <Navigate to="/dashboard" />;
  return <DriverView />;
}
