import { createFileRoute } from "@tanstack/react-router";
import { BalanceSheetPage } from "@accounting/presentation/BalanceSheetPage";

export const Route = createFileRoute("/_authenticated/accounting/balance-sheet")({ component: BalanceSheetPage });
