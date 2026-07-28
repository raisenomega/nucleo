import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useSuperAdmin } from "@shared/hooks/useSuperAdmin";
import { SecurityDashboard } from "@shared/security/presentation/SecurityDashboard";

export const Route = createFileRoute("/_authenticated/security")({ component: Page });

function Page() {
  const { isSuperAdmin } = useSuperAdmin();
  if (!isSuperAdmin) return <Navigate to="/dashboard" />;
  return <SecurityDashboard />;
}
