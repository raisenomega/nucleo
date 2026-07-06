import { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard, DollarSign, CreditCard, Route as RouteIcon, Package, UserPlus,
  Megaphone, Users, Scale, Settings, MoreHorizontal,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { MobileMoreDrawer } from "@shared/components/MobileMoreDrawer";

type Path = "/dashboard" | "/income" | "/expenses" | "/routes" | "/inventory" | "/leads" | "/marketing" | "/payroll" | "/reconciliation" | "/settings";
export type NavEntry = { to: Path; icon: LucideIcon; key: TranslationKey; mod: string };
const NAV: NavEntry[] = [
  { to: "/dashboard", icon: LayoutDashboard, key: "panel", mod: "dashboard" },
  { to: "/income", icon: DollarSign, key: "income", mod: "income" },
  { to: "/expenses", icon: CreditCard, key: "expenses", mod: "expenses" },
  { to: "/routes", icon: RouteIcon, key: "routes", mod: "routes" },
  { to: "/inventory", icon: Package, key: "inventory", mod: "inventory" },
  { to: "/leads", icon: UserPlus, key: "leads", mod: "leads" },
  { to: "/marketing", icon: Megaphone, key: "marketing", mod: "marketing" },
  { to: "/payroll", icon: Users, key: "payroll", mod: "payroll" },
  { to: "/reconciliation", icon: Scale, key: "reconciliation", mod: "reconciliation" },
  { to: "/settings", icon: Settings, key: "settings", mod: "settings" },
];

// Barra inferior PWA: solo módulos con can(mod,"view"). >5 -> 4 iconos + "Más" (drawer).
export function MobileNav() {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const { pathname } = useLocation();
  const [more, setMore] = useState(false);
  const access = NAV.filter((n) => can(n.mod, "view"));
  const overflow = access.length > 5;
  const bar = overflow ? access.slice(0, 4) : access.slice(0, 5);
  const cell = "relative flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 py-1.5 transition-colors";
  return (
    <>
      <nav className="mobile-nav fixed bottom-0 left-0 right-0 z-50 flex border-t border-border bg-card/90 md:hidden">
        {bar.map((n) => {
          const on = pathname.startsWith(n.to);
          return (
            <Link key={n.to} to={n.to} className={`${cell} ${on ? "text-primary" : "text-muted-foreground"}`}>
              {on && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" />}
              <n.icon className="h-6 w-6" /><span className="text-[10px] font-bold">{t(n.key)}</span>
            </Link>
          );
        })}
        {overflow && (
          <button type="button" onClick={() => setMore(true)} className={`${cell} text-muted-foreground`}>
            <MoreHorizontal className="h-6 w-6" /><span className="text-[10px] font-bold">{t("more")}</span>
          </button>
        )}
      </nav>
      {more && <MobileMoreDrawer items={access.slice(4)} onClose={() => setMore(false)} />}
    </>
  );
}
