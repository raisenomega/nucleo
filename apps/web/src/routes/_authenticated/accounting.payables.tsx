import { createFileRoute } from "@tanstack/react-router";
import { VendorBillsPage } from "@accounting/presentation/VendorBillsPage";

export const Route = createFileRoute("/_authenticated/accounting/payables")({ component: VendorBillsPage });
