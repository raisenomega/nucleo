import { createFileRoute } from "@tanstack/react-router";
import { ServicePagesListPage } from "@landing/presentation/service-pages-admin/ServicePagesListPage";

export const Route = createFileRoute("/_authenticated/settings/landing/service-pages/")({ component: ServicePagesListPage });
