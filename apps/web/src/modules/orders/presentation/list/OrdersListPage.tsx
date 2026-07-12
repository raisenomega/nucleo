import { useMemo } from "react";
import { Navigate, useNavigate } from "@tanstack/react-router";
import { ShoppingCart } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { Spinner } from "@shared/components/loading/Spinner";
import { EmptyState } from "@shared/components/loading/EmptyState";
import { isReady, isLoading, isError } from "@shared/types/fetch-state.types";
import { useOrders } from "@orders/application/useOrders.hook";
import { supabaseOrdersRepository } from "@orders/infrastructure/supabase-orders.repository";
import { OrdersFilters } from "@orders/presentation/list/OrdersFilters";
import { OrdersTable } from "@orders/presentation/list/OrdersTable";
import { OrdersMobileList } from "@orders/presentation/list/OrdersMobileList";
import type { OrderFilters, OrderStatus } from "@orders/domain/order.types";

export type OrdersSearch = { status?: string; from?: string; q?: string };

export function OrdersListPage({ search, onSearch }: { search: OrdersSearch; onSearch: (p: OrdersSearch) => void }) {
  const { t } = useI18n(); const { can } = useModuleAccess(); const nav = useNavigate();
  const filters: OrderFilters = useMemo(() => ({
    status: (search.status ? search.status.split(",") : []) as OrderStatus[], from: search.from ?? "", to: "", q: search.q ?? "",
  }), [search.status, search.from, search.q]);
  const { state, total, hasMore, loadMore } = useOrders(supabaseOrdersRepository, filters);
  if (!can("orders", "view")) return <Navigate to="/dashboard" />;
  const open = (id: string) => void nav({ to: "/orders/$orderId", params: { orderId: id } });
  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-foreground md:text-3xl">{t("orders")}</h1>
        {isReady(state) && <span className="text-sm text-muted-foreground">{state.data.length} / {total}</span>}
      </div>
      <OrdersFilters filters={filters} setStatus={(s) => onSearch({ ...search, status: s.join(",") || undefined })}
        setFrom={(from) => onSearch({ ...search, from: from || undefined })} setQ={(q) => onSearch({ ...search, q: q || undefined })} />
      {isLoading(state) && <div className="py-12"><Spinner /></div>}
      {isError(state) && <p className="py-8 text-center text-sm text-destructive">{t("ordErrGeneric")}</p>}
      {isReady(state) && (state.data.length ? (
        <>
          <OrdersTable orders={state.data} onOpen={open} />
          <OrdersMobileList orders={state.data} onOpen={open} />
          {hasMore && <button type="button" onClick={loadMore} className="mx-auto block rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary">{t("ordLoadMore")}</button>}
        </>
      ) : <EmptyState icon={ShoppingCart} title={t("ordEmptyTitle")} description={t("ordEmptyDesc")} />)}
    </div>
  );
}
