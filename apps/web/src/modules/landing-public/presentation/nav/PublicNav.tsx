import { Link } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { NavGlass } from "@landing-public/primitives/NavGlass";

// Nav público (placeholder 3.E.2.d): display_name a la izquierda. Menú de items llega en 3.E.3.
export function PublicNav({ displayName }: { displayName: string }) {
  const { t } = useI18n();
  return (
    <NavGlass ariaLabel={t("lpNavMenu")}>
      <Link to="/" className="font-display text-lg font-bold">{displayName}</Link>
    </NavGlass>
  );
}
