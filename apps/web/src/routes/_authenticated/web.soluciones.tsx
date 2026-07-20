import { createFileRoute } from "@tanstack/react-router";
import { SolutionsManager } from "@raisen-marketing/admin/SolutionsManager";

export const Route = createFileRoute("/_authenticated/web/soluciones")({ component: SolutionsManager });
