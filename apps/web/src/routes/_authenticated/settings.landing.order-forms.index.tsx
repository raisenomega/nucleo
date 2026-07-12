import { createFileRoute } from "@tanstack/react-router";
import { OrderFormsListPage } from "@order-forms/presentation/list/OrderFormsListPage";

export const Route = createFileRoute("/_authenticated/settings/landing/order-forms/")({ component: OrderFormsListPage });
