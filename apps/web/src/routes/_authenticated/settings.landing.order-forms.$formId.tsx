import { createFileRoute } from "@tanstack/react-router";
import { OrderFormEditorPage } from "@order-forms/presentation/editor/OrderFormEditorPage";

export const Route = createFileRoute("/_authenticated/settings/landing/order-forms/$formId")({ component: Page });

function Page() {
  const { formId } = Route.useParams();
  return <OrderFormEditorPage formId={formId} />;
}
