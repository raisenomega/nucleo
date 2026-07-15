import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useI18n } from "@shared/i18n";

// Barra sticky "Volver al inicio" arriba de la página de servicio → home landing.
export function ServicePageBackNav() {
  const { t } = useI18n();
  return (
    <div className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <Link to="/" className="mx-auto flex max-w-7xl items-center gap-1 px-6 py-3 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> {t("backToHome")}
      </Link>
    </div>
  );
}
