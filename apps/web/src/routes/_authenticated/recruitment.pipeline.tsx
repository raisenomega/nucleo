import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useRoleGate } from "@shared/hooks/useRoleGate";
import { PipelinePage } from "@hr/presentation/PipelinePage";

export const Route = createFileRoute("/_authenticated/recruitment/pipeline")({
  validateSearch: (s: Record<string, unknown>) => ({ opening: typeof s.opening === "string" ? s.opening : "" }),
  component: Page,
});

function Page() {
  const { canEdit } = useRoleGate();
  const { opening } = Route.useSearch();
  if (!canEdit("coo")) return <Navigate to="/dashboard" />;
  if (!opening) return <Navigate to="/recruitment" />;
  return <PipelinePage openingId={opening} />;
}
