import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { OrdersListPage, type OrdersSearch } from "@orders/presentation/list/OrdersListPage";

export const Route = createFileRoute("/_authenticated/orders/")({
  validateSearch: (s: Record<string, unknown>): OrdersSearch => ({
    status: typeof s.status === "string" ? s.status : undefined,
    from: typeof s.from === "string" ? s.from : undefined,
    q: typeof s.q === "string" ? s.q : undefined,
  }),
  component: Page,
});

function Page() {
  const search = Route.useSearch();
  const nav = useNavigate();
  const onSearch = (p: OrdersSearch) => void nav({ to: "/orders", search: () => p });
  return <OrdersListPage search={search} onSearch={onSearch} />;
}
