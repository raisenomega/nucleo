import { Navigate } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { Spinner } from "@shared/components/loading/Spinner";
import { isReady, isLoading } from "@shared/types/fetch-state.types";
import { useOrderForm } from "@order-forms/application/useOrderForm.hook";
import { supabaseOrderFormsRepository } from "@order-forms/infrastructure/supabase-order-forms.repository";
import { FormEditor } from "@order-forms/presentation/editor/FormEditor";

export function OrderFormEditorPage({ formId }: { formId: string }) {
  const { t } = useI18n(); const { can } = useModuleAccess();
  const { state } = useOrderForm(supabaseOrderFormsRepository, formId);
  if (!can("settings", "edit")) return <Navigate to="/dashboard" />;
  if (isLoading(state)) return <div className="py-16"><Spinner /></div>;
  if (!isReady(state)) return <div className="p-8 text-center text-sm text-muted-foreground">{t("ofErr")}</div>;
  return <FormEditor form={state.data} />;
}
