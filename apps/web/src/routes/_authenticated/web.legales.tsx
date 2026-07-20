import { createFileRoute } from "@tanstack/react-router";
import { LegalManager } from "@raisen-marketing/admin/LegalManager";

export const Route = createFileRoute("/_authenticated/web/legales")({ component: LegalManager });
