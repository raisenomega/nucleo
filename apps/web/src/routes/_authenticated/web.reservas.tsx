import { createFileRoute } from "@tanstack/react-router";
import { BookingsManager } from "@raisen-marketing/admin/BookingsManager";

export const Route = createFileRoute("/_authenticated/web/reservas")({ component: BookingsManager });
