import { createFileRoute } from "@tanstack/react-router";
import { ChartOfAccountsPage } from "@accounting/presentation/ChartOfAccountsPage";

export const Route = createFileRoute("/_authenticated/accounting/chart")({ component: ChartOfAccountsPage });
