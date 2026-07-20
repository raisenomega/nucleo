import { createFileRoute } from "@tanstack/react-router";
import { ProcessManager } from "@raisen-marketing/admin/ProcessManager";

export const Route = createFileRoute("/_authenticated/web/proceso")({ component: ProcessManager });
