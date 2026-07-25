import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";

// Layout de /accounting: gate por módulo + passthrough. Las sub-rutas (chart/journal) rinden en el Outlet.
export const Route = createFileRoute("/_authenticated/accounting")({ component: AccountingLayout });

function AccountingLayout() {
  const { can } = useModuleAccess();
  if (!can("accounting", "view")) return <Navigate to="/dashboard" />;
  return <Outlet />;
}
