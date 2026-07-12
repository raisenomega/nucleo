import { createFileRoute } from "@tanstack/react-router";
import { AgendaSettingsPage } from "@agenda/presentation/AgendaSettingsPage";

export const Route = createFileRoute("/_authenticated/settings/agenda")({ component: AgendaSettingsPage });
