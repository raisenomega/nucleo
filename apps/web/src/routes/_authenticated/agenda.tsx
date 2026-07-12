import { createFileRoute } from "@tanstack/react-router";
import { AgendaPage } from "@agenda/presentation/AgendaPage";

export const Route = createFileRoute("/_authenticated/agenda")({ component: AgendaPage });
