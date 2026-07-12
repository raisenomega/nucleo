import { Link } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { EmptyState } from "@shared/components/loading";
import { AgendaServiceRow } from "@agenda/presentation/AgendaServiceRow";
import type { ReservableService } from "@agenda/domain/reservable-service.types";

export function AgendaServicesTable({ list, onUpdate }: { list: ReservableService[]; onUpdate: (id: string, rt: string, rp: number | null) => void }) {
  const { t } = useI18n();
  if (list.length === 0)
    return (
      <EmptyState title={t("agendaNoReservable")} description={t("agendaNoReservableHint")}>
        <Link to="/settings/landing/services" className="text-primary underline">{t("services")}</Link>
      </EmptyState>
    );
  return <div className="rounded-lg border border-border p-3">{list.map((s) => <AgendaServiceRow key={s.id} svc={s} onChange={(rt, rp) => onUpdate(s.id, rt, rp)} />)}</div>;
}
