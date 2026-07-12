import { createFileRoute } from "@tanstack/react-router";
import { OrderDetailPage } from "@orders/presentation/detail/OrderDetailPage";

export const Route = createFileRoute("/_authenticated/orders/$orderId")({ component: Page });

function Page() {
  const { orderId } = Route.useParams();
  return <OrderDetailPage orderId={orderId} />;
}
