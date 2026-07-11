import { createFileRoute, Outlet } from "@tanstack/react-router";

// Layout de /settings: passthrough. El índice (settings.index) rinde los tabs; las sub-rutas
// (settings.landing.*) rinden en este <Outlet />. Sin este layout con Outlet, los hijos no renderizan.
export const Route = createFileRoute("/_authenticated/settings")({ component: SettingsLayout });

function SettingsLayout() {
  return <Outlet />;
}
