import { Link } from "@tanstack/react-router";
import { LogOut, User, Settings } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { PortalNav } from "@shared/portal/PortalNav";

// Drawer mobile (md:hidden): overlay negro + panel izquierdo con las MISMAS secciones del sidebar desktop
// (reusa PortalNav variant="side", onNavigate=cerrar) + footer perfil/config/salir. Cierra al navegar o tocar overlay.
export function PortalMobileDrawer({ open, onClose, onLogout, logoUrl, displayName }: {
  open: boolean; onClose: () => void; onLogout: () => void; logoUrl: string | null; displayName: string;
}) {
  const { t } = useI18n();
  if (!open) return null;
  const ico = "grid h-9 w-9 shrink-0 place-items-center rounded-lg hover:bg-secondary";
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={onClose} />
      <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col overflow-y-auto border-r border-border bg-background md:hidden">
        <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
          {logoUrl ? <img src={logoUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" /> : <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary font-display font-bold text-primary-foreground">{(displayName.trim()[0] ?? "N").toUpperCase()}</span>}
          <span className="truncate font-display font-bold">{displayName}</span>
        </div>
        <PortalNav variant="side" onNavigate={onClose} />
        <div className="flex items-center gap-2 border-t border-border p-2">
          <Link to="/portal/profile" onClick={onClose} aria-label={t("navProfile")} className={ico}><User className="h-5 w-5" /></Link>
          <Link to="/portal/settings" onClick={onClose} aria-label={t("navSettings")} className={ico}><Settings className="h-5 w-5" /></Link>
          <div className="flex-1" />
          <button type="button" onClick={() => { onClose(); onLogout(); }} aria-label={t("signOut")} className={ico}><LogOut className="h-5 w-5" /></button>
        </div>
      </aside>
    </>
  );
}
