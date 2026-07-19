import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { usePortal } from "@shared/portal/portal-context";
import { useCustomerServices } from "@shared/portal/useCustomerServices.hook";
import { AppointmentCard } from "@shared/portal/AppointmentCard";

export const Route = createFileRoute("/portal/_app/appointments")({ component: PortalAppointments });

function PortalAppointments() {
  const { t } = useI18n();
  const { customer } = usePortal();
  const s = useCustomerServices(customer.tenantId);
  const cancel = (id: string) => { if (window.confirm(t("pCancelApptQ"))) void s.cancel(id); };
  const reschedule = (id: string, st: string, e: string) => void s.reschedule(id, st, e);
  return (
    <div className="space-y-3">
      <h1 className="font-display text-2xl font-bold text-foreground">{t("navAppointments")}</h1>
      {s.appointments.length === 0 && <p className="text-sm text-muted-foreground">{t("pNoAppointments")}</p>}
      {s.appointments.map((a) => <AppointmentCard key={a.id} appt={a} onReschedule={reschedule} onCancel={cancel} />)}
    </div>
  );
}
