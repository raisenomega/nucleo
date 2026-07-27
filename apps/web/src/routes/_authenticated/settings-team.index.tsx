import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { useRoleGate } from "@shared/hooks/useRoleGate";
import { useAdmin } from "@admin/application/useAdmin.hook";
import { supabaseAdminRepository } from "@admin/infrastructure/supabase-admin.repository";
import { AdminTeamTab } from "@admin/presentation/AdminTeamTab";

export const Route = createFileRoute("/_authenticated/settings-team/")({ component: TeamPage });

// Acceso directo al equipo desde el sidebar (RRHH). El expediente vive en /settings-team/$userId.
function TeamPage() {
  const { t } = useI18n();
  const { canEdit } = useRoleGate();
  const m = useAdmin(supabaseAdminRepository);
  if (!canEdit("ceo")) return <Navigate to="/dashboard" />;
  return (
    <div className="space-y-6 p-4 md:p-8">
      <h1 className="font-display text-xl font-bold text-foreground md:text-3xl">{t("team")}</h1>
      <AdminTeamTab team={m.team} onInvite={m.invite} onStatus={m.setStatus} onRole={m.changeRole} />
    </div>
  );
}
