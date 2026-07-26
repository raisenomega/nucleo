import { createFileRoute } from "@tanstack/react-router";
import { CashFlowPage } from "@accounting/presentation/CashFlowPage";

export const Route = createFileRoute("/_authenticated/accounting/cash-flow")({ component: CashFlowPage });
