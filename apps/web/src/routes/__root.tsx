import { HeadContent, Outlet, Scripts, createRootRoute, useLocation } from "@tanstack/react-router";
import appCss from "../styles/index.css?url";
import { I18nProvider, useI18n } from "@shared/i18n";
import { ThemeToggle } from "@shared/components/ThemeToggle";
import { HostBrandProvider } from "@shared/providers/HostBrandProvider";
import { useMounted } from "@shared/hooks/useMounted";
import { isRaisenHost } from "@shared/lib/brand-host";
import { ErrorBoundary } from "@shared/components/loading";
import { ToastProvider } from "@shared/providers/ToastProvider";

const THEME_SCRIPT = `(function(){try{var c=JSON.parse(localStorage.getItem("nucleo:theme-cache:v1")||"null"),s=localStorage.getItem("theme"),m=window.matchMedia,dm=c&&c.defaultMode,d;if(s==="dark"||s==="light"){d=s==="dark";}else if(dm==="dark"||dm==="light"){d=dm==="dark";}else if(m&&m("(prefers-color-scheme: light)").matches){d=false;}else{d=true;}document.documentElement.classList.toggle("dark",d);if(c&&c.vars){for(var k in c.vars){document.documentElement.style.setProperty(k,c.vars[k]);}}}catch(e){}})();`;

// SW del panel: solo en hosts panel (app.*) + Raisen. La landing del tenant usa service-worker-public.js (sin colisión).
const SW_SCRIPT = `(function(){var h=location.hostname,r=["nucleoraisen.com","www.nucleoraisen.com","nucleo-blush.vercel.app"].indexOf(h)>=0;if((r||h.indexOf("app.")===0)&&"serviceWorker" in navigator){window.addEventListener("load",function(){navigator.serviceWorker.register("/service-worker.js").catch(function(){});});}})();`;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Portal" },
      { name: "theme-color", content: "hsl(38 85% 55%)" },
      { name: "apple-mobile-web-app-capable", content: "yes" }, { name: "mobile-web-app-capable", content: "yes" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" }, { rel: "icon", href: "/favicon.ico", sizes: "any" }, { rel: "apple-touch-icon", href: "/icons/icon-192.png" },
      { rel: "manifest", href: "/manifest.json" },
    ],
    scripts: [{ children: THEME_SCRIPT }, { children: SW_SCRIPT }],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <I18nProvider>
      <HostBrandProvider><Document /></HostBrandProvider>
    </I18nProvider>
  );
}

const PUBLIC = new Set(["/", "/login", "/registro", "/pin", "/agendar-consulta"]);

// Controles globales — solo en rutas públicas; en autenticadas viven en AppLayout.
function GlobalControls() {
  const { t, locale, setLocale } = useI18n();
  const { pathname } = useLocation();
  const mounted = useMounted();
  if (!PUBLIC.has(pathname)) return null;
  if (mounted && pathname === "/" && !isRaisenHost() && !window.location.hostname.startsWith("app.")) return null; // landing: toggles en el nav
  return (
    <div className="fixed top-4 right-4 z-50 flex gap-2">
      <ThemeToggle />
      <button type="button" onClick={() => setLocale(locale === "es" ? "en" : "es")} aria-label={t("switchLang")}
        className="bg-secondary text-foreground rounded-lg p-2 font-body">{locale === "es" ? "EN" : "ES"}</button>
    </div>
  );
}

function Document() {
  const { locale } = useI18n();
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <GlobalControls />
        <ErrorBoundary><ToastProvider><Outlet /></ToastProvider></ErrorBoundary>
        <Scripts />
      </body>
    </html>
  );
}
