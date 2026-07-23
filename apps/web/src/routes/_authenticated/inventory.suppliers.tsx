import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { useSuppliers } from "@fieldops/application/useSuppliers.hook";
import { supabaseSupplierRepository } from "@fieldops/infrastructure/supabase-suppliers.repository";
import { InventorySuppliers } from "@fieldops/presentation/InventorySuppliers";
import type { Supplier, SupplierFormData } from "@fieldops/domain/supplier.types";

// Ruta propia de Proveedores (antes escondida dentro de /inventory). Escritura sigue CEO-only (RLS).
export const Route = createFileRoute("/_authenticated/inventory/suppliers")({ component: SuppliersPage });

function SuppliersPage() {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const sup = useSuppliers(supabaseSupplierRepository);
  const onSave = async (id: string | null, d: SupplierFormData) => (id ? await sup.update(id, d) : await sup.create(d)).ok;
  if (!can("inventory", "view")) return <Navigate to="/dashboard" />;
  return (
    <div className="space-y-6 p-4 md:p-8">
      <h1 className="font-display text-xl font-bold text-foreground md:text-3xl">{t("suppliers")}</h1>
      <InventorySuppliers items={sup.items} onSave={onSave} onToggle={(s: Supplier) => void sup.update(s.id, { ...s, active: !s.active })} />
    </div>
  );
}
