import { createFileRoute } from "@tanstack/react-router";
import { TestimonialsManager } from "@raisen-marketing/admin/TestimonialsManager";

export const Route = createFileRoute("/_authenticated/web/testimonios")({ component: TestimonialsManager });
