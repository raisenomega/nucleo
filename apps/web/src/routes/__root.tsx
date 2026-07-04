import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import appCss from "../styles/index.css?url";
import { I18nProvider, useI18n } from "@shared/i18n";

const THEME_SCRIPT = `(function(){try{var s=localStorage.getItem("theme"),m=window.matchMedia,d;if(s==="dark"||s==="light"){d=s==="dark";}else if(m&&m("(prefers-color-scheme: dark)").matches){d=true;}else if(m&&m("(prefers-color-scheme: light)").matches){d=false;}else{d=true;}document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "NÚCLEO by raisen" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
    scripts: [{ children: THEME_SCRIPT }],
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

function Document() {
  const { locale } = useI18n();
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}
