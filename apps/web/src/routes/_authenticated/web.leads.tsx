import { createFileRoute } from "@tanstack/react-router";
import { LeadsInbox } from "@raisen-marketing/admin/LeadsInbox";

export const Route = createFileRoute("/_authenticated/web/leads")({ component: LeadsInbox });
