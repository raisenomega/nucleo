import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useAuth } from "@identity/application/useAuth.hook";
import { supabaseAuthAdapter } from "@identity/infrastructure/supabase-auth.adapter";
import { TrialBanner } from "@shared/components/TrialBanner";
import { useI18n } from "@shared/i18n";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { session, signOut } = useAuth(supabaseAuthAdapter);
  const { t } = useI18n();
  const navigate = useNavigate();

  async function onLogout() {
    await signOut();
    void navigate({ to: "/login" });
  }

  return (
    <main className="min-h-screen bg-background text-foreground p-8">
      <div className="mx-auto max-w-2xl space-y-4">
        <TrialBanner session={session} />
        <h1 className="font-display text-4xl font-bold text-primary">{t("welcome")}</h1>
        <p className="font-body text-lg">{session?.email ?? "—"}</p>
        <p className="font-body text-muted-foreground">{t("role")}: {session?.role ?? "—"}</p>
        <div className="flex gap-3">
          <Link
            to="/income"
            className="rounded-lg bg-primary text-primary-foreground px-4 py-2 font-body font-bold"
          >
            {t("income")}
          </Link>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-lg bg-secondary text-foreground px-4 py-2 font-body font-bold"
          >
            {t("logout")}
          </button>
        </div>
      </div>
    </main>
  );
}
