import { createFileRoute } from "@tanstack/react-router";
import { CouponsListPage } from "@landing/presentation/coupons-admin/CouponsListPage";

export const Route = createFileRoute("/_authenticated/settings/landing/coupons")({ component: CouponsListPage });
