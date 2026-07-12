import { useI18n } from "@shared/i18n";
import { isReady } from "@shared/types/fetch-state.types";
import { useOrderForms } from "@order-forms/application/useOrderForms.hook";
import { supabaseOrderFormsRepository } from "@order-forms/infrastructure/supabase-order-forms.repository";

// Dropdown para asignar el formulario de pedido a un item del catálogo. null = usar el default del tenant.
export function OrderFormPicker({ value, onChange }: { value: string | null; onChange: (id: string | null) => void }) {
  const { t } = useI18n();
  const { state } = useOrderForms(supabaseOrderFormsRepository);
  const forms = isReady(state) ? state.data : [];
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{t("ofItemFormLabel")}</span>
      <select value={value ?? ""} onChange={(e) => onChange(e.target.value || null)} className="w-full rounded-lg border border-border bg-background p-2 text-sm">
        <option value="">{t("ofItemFormDefault")}</option>
        {forms.map((f) => <option key={f.id} value={f.id}>{f.name}{f.isDefault ? ` (${t("ofDefault")})` : ""}</option>)}
      </select>
      <span className="mt-1 block text-xs text-muted-foreground">{t("ofItemFormHint")}</span>
    </label>
  );
}
