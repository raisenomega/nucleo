import { Sparkles, ArrowUpRight, Check } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useRoleGate } from "@shared/hooks/useRoleGate";

const OMEGA_URL = "https://www.omegaraisen.agency";

// Ola 2.9 · cross-sell de OMEGA (el producto de marketing con IA de Raisen). Solo CEO/dueño: los operativos no
// deciden compras y sería ruido. Card sutil (no banner). Respeta el tema del tenant vía tokens semánticos
// (white-label — nunca el dorado de Raisen). `variant` adapta el mensaje al contexto (dashboard vs /marketing).
export function OmegaCrossSellCard({ variant = "default" }: { variant?: "default" | "marketing" }) {
  const { t } = useI18n();
  const { canEdit } = useRoleGate();
  if (!canEdit("ceo")) return null;
  const bullets = [t("omegaBullet1"), t("omegaBullet2"), t("omegaBullet3")];
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <div className="shrink-0 rounded-lg bg-secondary p-2"><Sparkles className="h-5 w-5 text-foreground" /></div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-bold text-foreground">{t("omegaTitle")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{variant === "marketing" ? t("omegaMsgMarketing") : t("omegaMsg")}</p>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
            {bullets.map((b, i) => <li key={i} className="flex items-center gap-1 text-xs text-muted-foreground"><Check className="h-3 w-3 text-primary" />{b}</li>)}
          </ul>
          <a href={OMEGA_URL} target="_blank" rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-body font-bold text-primary-foreground transition hover:opacity-90">
            {t("omegaCta")} <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
