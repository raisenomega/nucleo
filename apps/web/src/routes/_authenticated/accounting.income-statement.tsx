import { createFileRoute } from "@tanstack/react-router";
import { IncomeStatementPage } from "@accounting/presentation/IncomeStatementPage";

export const Route = createFileRoute("/_authenticated/accounting/income-statement")({ component: IncomeStatementPage });
