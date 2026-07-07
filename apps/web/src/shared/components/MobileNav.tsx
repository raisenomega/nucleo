import { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard, DollarSign, CreditCard, Route as RouteIcon, Package, UserPlus,
  Megaphone, Users, Scale, Settings, UserCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { MobileAccountSheet } from "@shared/components/MobileAccountSheet";

type Path = "/dashboard" | "/income" | "/expenses" | "/routes" | "/inventory" | "/leads" | "/marketing" | "/payroll" | "/reconciliation" | "/settings";
const NAV: { to: Path; icon: LucideIcon; key: TranslationKey; mod: string }[] = [
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

// Barra inferior PWA: scroll horizontal con todos los módulos accesibles + cuenta (tema/idioma/logout).
export function MobileNav() {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const { pathname } = useLocation();
  const [account, setAccount] = useState(false);
  const cell = "relative flex min-h-[52px] min-w-[64px] shrink-0 flex-col items-center justify-center gap-0.5 py-1.5 transition-colors";
  return (
    <>
      <nav className="mobile-nav fixed bottom-0 left-0 right-0 z-50 flex overflow-x-auto border-t border-border bg-card/90 md:hidden">
        {NAV.filter((n) => can(n.mod, "view")).map((n) => {
          const on = pathname.startsWith(n.to);
          return (
            <Link key={n.to} to={n.to} className={`${cell} ${on ? "text-primary" : "text-muted-foreground"}`}>
              {on && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" />}
              <n.icon className="h-6 w-6" /><span className="text-[10px] font-bold">{t(n.key)}</span>
            </Link>
          );
        })}
        <button type="button" onClick={() => setAccount(true)} className={`${cell} text-muted-foreground`}>
          <UserCircle className="h-6 w-6" /><span className="text-[10px] font-bold">{t("account")}</span>
        </button>
      </nav>
      {account && <MobileAccountSheet onClose={() => setAccount(false)} />}
    </>
  );
}
