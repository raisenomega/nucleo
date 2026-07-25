import { createFileRoute } from "@tanstack/react-router";
import { JournalEntriesPage } from "@accounting/presentation/JournalEntriesPage";

export const Route = createFileRoute("/_authenticated/accounting/journal")({ component: JournalEntriesPage });
