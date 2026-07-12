import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AgendaPage } from "@agenda/presentation/AgendaPage";

export const Route = createFileRoute("/_authenticated/agenda")({
  validateSearch: (s: Record<string, unknown>): { view?: string; week?: string; month?: string } => ({
    view: typeof s.view === "string" ? s.view : undefined,
    week: typeof s.week === "string" ? s.week : undefined,
    month: typeof s.month === "string" ? s.month : undefined,
  }),
  component: Page,
});

function Page() {
  const search = Route.useSearch();
  const nav = useNavigate();
  const onSearch = (patch: { view?: string; week?: string; month?: string }) => void nav({ to: "/agenda", search: (prev) => ({ ...prev, ...patch }) });
  return <AgendaPage search={search} onSearch={onSearch} />;
}
