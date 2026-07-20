import { createFileRoute } from "@tanstack/react-router";
import { SectionsManager } from "@raisen-marketing/admin/SectionsManager";

export const Route = createFileRoute("/_authenticated/web/secciones")({ component: SectionsManager });
