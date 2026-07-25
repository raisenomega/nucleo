import { createFileRoute } from "@tanstack/react-router";
import { PeriodClosePage } from "@accounting/presentation/PeriodClosePage";

export const Route = createFileRoute("/_authenticated/accounting/period-close")({ component: PeriodClosePage });
