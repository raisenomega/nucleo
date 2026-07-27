import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useRoleGate } from "@shared/hooks/useRoleGate";
import { RecruitmentPage } from "@hr/presentation/RecruitmentPage";

export const Route = createFileRoute("/_authenticated/recruitment/")({ component: Page });

// Reclutamiento gated a coo+ (= is_ceo_or_above en el backend).
function Page() {
  const { canEdit } = useRoleGate();
  if (!canEdit("coo")) return <Navigate to="/dashboard" />;
  return <RecruitmentPage />;
}
