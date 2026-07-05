import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@identity/application/useAuth.hook";
import { supabaseAuthAdapter } from "@identity/infrastructure/supabase-auth.adapter";
import { TrialBanner } from "@shared/components/TrialBanner";
import { useI18n } from "@shared/i18n";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { session } = useAuth(supabaseAuthAdapter);
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-2xl space-y-4 p-8">
      <TrialBanner session={session} />
      <h1 className="font-display text-4xl font-bold text-primary">{t("welcome")}</h1>
      <p className="font-body text-lg">{session?.email ?? "—"}</p>
      <p className="font-body text-muted-foreground">{t("role")}: {session?.role ?? "—"}</p>
    </div>
  );
}
