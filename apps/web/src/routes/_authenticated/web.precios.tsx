import { createFileRoute } from "@tanstack/react-router";
import { PricingManager } from "@raisen-marketing/admin/PricingManager";

export const Route = createFileRoute("/_authenticated/web/precios")({ component: PricingManager });
