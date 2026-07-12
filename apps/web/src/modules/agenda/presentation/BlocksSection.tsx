import { useState } from "react";
import { Plus } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useSession } from "@shared/providers/SessionProvider";
import { useToast } from "@shared/providers/toast-context";
import { useBlockedPeriods } from "@agenda/application/useBlockedPeriods.hook";
import { supabaseBlockedPeriodsRepository } from "@agenda/infrastructure/supabase-blocked-periods.repository";
import { BlockedPeriodsList } from "@agenda/presentation/BlockedPeriodsList";
import { BlockedPeriodModal } from "@agenda/presentation/BlockedPeriodModal";
import type { BlockedPeriodInput } from "@agenda/domain/blocked-period.types";

export function BlocksSection() {
  const { t } = useI18n();
  const { session } = useSession();
  const toast = useToast();
  const { list, create, remove } = useBlockedPeriods(supabaseBlockedPeriodsRepository, session?.tenantId);
  const [modal, setModal] = useState(false);
  async function onSave(i: BlockedPeriodInput) { const r = await create(i); if (r.ok) { toast.success(t("saved")); setModal(false); } else toast.error(r.error); }
  async function onDelete(id: string) { if (window.confirm(t("confirmDelete"))) { const r = await remove(id); if (!r.ok) toast.error(r.error); } }
  return (
    <div className="space-y-4">
      <button type="button" onClick={() => setModal(true)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" />{t("agendaAddBlock")}</button>
      <BlockedPeriodsList list={list} onDelete={onDelete} />
      {modal && <BlockedPeriodModal onSave={onSave} onClose={() => setModal(false)} />}
    </div>
  );
}
