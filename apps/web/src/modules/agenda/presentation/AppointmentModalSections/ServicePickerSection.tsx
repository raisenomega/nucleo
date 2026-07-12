import { useState } from "react";
import { Plus } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useSession } from "@shared/providers/SessionProvider";
import { NestedCreateServiceModal } from "@agenda/presentation/AppointmentModalSections/NestedCreateServiceModal";
import type { ReservableService, ServiceInput } from "@agenda/domain/reservable-service.types";

export function ServicePickerSection({ services, value, onChange, onCreate }: {
  services: ReservableService[]; value: string | null; onChange: (id: string) => void; onCreate: (i: ServiceInput) => Promise<void>;
}) {
  const { t } = useI18n();
  const { session } = useSession();
  const [open, setOpen] = useState(false);
  const isCeo = ["ceo", "superadmin"].includes(session?.role ?? "");
  const fld = "flex-1 rounded-lg border border-border bg-background p-2 text-sm";
  async function save(i: ServiceInput) { await onCreate(i); setOpen(false); }
  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-foreground">{t("agendaService")}</span>
      <div className="flex items-center gap-2">
        <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={fld}><option value="">—</option>{services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        {isCeo && <button type="button" onClick={() => setOpen(true)} aria-label={t("agendaServiceModalTitle")} className="shrink-0 rounded-lg bg-primary p-2 text-primary-foreground"><Plus className="h-4 w-4" /></button>}
      </div>
      {open && <NestedCreateServiceModal onSave={save} onClose={() => setOpen(false)} />}
    </div>
  );
}
