import { useI18n } from "@shared/i18n";
import { useToast } from "@shared/providers/toast-context";
import { useReservableServices } from "@agenda/application/useReservableServices.hook";
import { supabaseReservableServicesRepository } from "@agenda/infrastructure/supabase-reservable-services.repository";
import { AgendaServicesTable } from "@agenda/presentation/AgendaServicesTable";

export function ServicesSection() {
  const { t } = useI18n();
  const toast = useToast();
  const { list, update } = useReservableServices(supabaseReservableServicesRepository);
  async function onUpdate(id: string, rt: string, rp: number | null) { const r = await update(id, rt, rp); if (r.ok) toast.success(t("saved")); else toast.error(r.error); }
  return <AgendaServicesTable list={list} onUpdate={onUpdate} />;
}
