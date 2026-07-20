import { createFileRoute } from "@tanstack/react-router";
import { FooterEditor } from "@raisen-marketing/admin/FooterEditor";

export const Route = createFileRoute("/_authenticated/web/footer")({ component: FooterEditor });
