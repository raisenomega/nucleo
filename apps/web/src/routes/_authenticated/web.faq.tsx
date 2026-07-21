import { createFileRoute } from "@tanstack/react-router";
import { FaqManager } from "@raisen-marketing/admin/FaqManager";

export const Route = createFileRoute("/_authenticated/web/faq")({ component: FaqManager });
