import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { useInventory } from "@fieldops/application/useInventory.hook";
import { useSuppliers } from "@fieldops/application/useSuppliers.hook";
import { supabaseInventoryRepository } from "@fieldops/infrastructure/supabase-inventory.repository";
import { supabaseSupplierRepository } from "@fieldops/infrastructure/supabase-suppliers.repository";
import { InventoryPurchaseOrders } from "@fieldops/presentation/InventoryPurchaseOrders";

// Ruta propia de Órdenes de compra (antes escondida dentro de /inventory). Ciclo completo: crear→ordenar→recibir.
export const Route = createFileRoute("/_authenticated/inventory/purchase-orders")({ component: PurchaseOrdersPage });

function PurchaseOrdersPage() {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const inv = useInventory(supabaseInventoryRepository);
  const sup = useSuppliers(supabaseSupplierRepository);
  if (!can("inventory", "view")) return <Navigate to="/dashboard" />;
  return (
    <div className="space-y-6 p-4 md:p-8">
      <h1 className="font-display text-xl font-bold text-foreground md:text-3xl">{t("purchaseOrders")}</h1>
      <InventoryPurchaseOrders suppliers={sup.items} items={inv.items} onChanged={inv.refresh} />
    </div>
  );
}
