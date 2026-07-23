import { createFileRoute, Outlet } from "@tanstack/react-router";

// Layout de /inventory: passthrough. El índice (inventory.index) rinde Artículos; las sub-rutas
// (suppliers, purchase-orders) rinden en este <Outlet />. Sin este layout con Outlet, los hijos no renderizan.
export const Route = createFileRoute("/_authenticated/inventory")({ component: InventoryLayout });

function InventoryLayout() {
  return <Outlet />;
}
