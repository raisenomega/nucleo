import { Link } from "@tanstack/react-router";
import { UserCheck } from "lucide-react";
import { useI18n } from "@shared/i18n";

// Nombre del cliente como link a su perfil del maestro + badge cuando hay customer_id; texto plano de fallback.
// Espejo del patrón de OrderCustomerInfo (Ola 2.1d-i), reutilizable en quote/invoice/order.
export function LinkedCustomerBadge({ customerId, name, className }: { customerId: string | null; name: string; className?: string }) {
  const { t } = useI18n();
  if (!customerId) return <span className={className}>{name || "—"}</span>;
  return (
    <span className={`inline-flex flex-wrap items-center gap-2 ${className ?? ""}`}>
      <Link to="/customers" search={{ view: customerId }} className="text-primary hover:underline">{name || "—"}</Link>
      <span className="inline-flex items-center gap-1 rounded bg-green-500/10 px-1.5 py-0.5 text-[10px] font-bold text-green-600">
        <UserCheck className="h-3 w-3" />{t("ordLinkedCustomer")}
      </span>
    </span>
  );
}
