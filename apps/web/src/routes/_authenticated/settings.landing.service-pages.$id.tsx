import { createFileRoute } from "@tanstack/react-router";
import { ServicePageEditorPage } from "@landing/presentation/service-pages-admin/ServicePageEditorPage";

export const Route = createFileRoute("/_authenticated/settings/landing/service-pages/$id")({ component: Page });

function Page() {
  const { id } = Route.useParams();
  return <ServicePageEditorPage id={id} />;
}
