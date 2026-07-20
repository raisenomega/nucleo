import { createFileRoute } from "@tanstack/react-router";
import { AvailabilityManager } from "@raisen-marketing/admin/AvailabilityManager";

export const Route = createFileRoute("/_authenticated/web/disponibilidad")({ component: AvailabilityManager });
