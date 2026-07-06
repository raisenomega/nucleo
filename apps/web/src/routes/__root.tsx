import { HeadContent, Outlet, Scripts, createRootRoute, useLocation } from "@tanstack/react-router";
import appCss from "../styles/index.css?url";
import { I18nProvider, useI18n } from "@shared/i18n";
import { ThemeToggle } from "@shared/components/ThemeToggle";

const THEME_SCRIPT = `(function(){try{var s=localStorage.getItem("theme"),m=window.matchMedia,d;if(s==="dark"||s==="light"){d=s==="dark";}else if(m&&m("(prefers-color-scheme: dark)").matches){d=true;}else if(m&&m("(prefers-color-scheme: light)").matches){d=false;}else{d=true;}document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

// Registra el service worker solo en producción (no en localhost).
const SW_SCRIPT = `if("serviceWorker" in navigator&&location.hostname!=="localhost"){window.addEventListener("load",function(){navigator.serviceWorker.register("/service-worker.js").catch(function(){});});}`;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "NÚCLEO by raisen" },
      { name: "theme-color", content: "hsl(38 85% 55%)" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "manifest", href: "/manifest.json" },
    ],
    scripts: [{ children: THEME_SCRIPT }, { children: SW_SCRIPT }],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <I18nProvider>
      <Document />
    </I18nProvider>
  );
}

const PUBLIC = new Set(["/", "/login", "/registro", "/pin", "/agendar-consulta"]);

// Controles globales — solo en rutas públicas; en autenticadas viven en AppLayout.
function GlobalControls() {
  const { t, locale, setLocale } = useI18n();
  const { pathname } = useLocation();
  if (!PUBLIC.has(pathname)) return null;
  return (
    <div className="fixed top-4 right-4 z-50 flex gap-2">
      <ThemeToggle />
      <button
        type="button"
        onClick={() => setLocale(locale === "es" ? "en" : "es")}
        aria-label={t("switchLang")}
        className="bg-secondary text-foreground rounded-lg p-2 font-body"
      >
        {locale === "es" ? "EN" : "ES"}
      </button>
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
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}
