import { supabase } from "@shared/lib/supabase";
import type { CreateOrderInput, OrderForm, OrderFormField, PaymentOption, PricingRules } from "@orders-public/domain/order-form.types";

type FormRow = { id: string; name: string; submit_button_label_es: string | null; submit_button_label_en: string | null; cancel_button_label_es: string | null; cancel_button_label_en: string | null; show_summary: boolean | null; summary_footer_es: string | null; summary_footer_en: string | null };
type FieldRow = { id: string; order_index: number; kind: string; field_key: string; label_es: string; label_en: string | null; placeholder_es: string | null; placeholder_en: string | null; required: boolean; validation_rules: Record<string, unknown>; options: unknown; conditional_on: unknown; group_name: string | null; group_description_es: string | null; group_description_en: string | null };

const toField = (r: FieldRow): OrderFormField => ({
  id: r.id, orderIndex: r.order_index, kind: r.kind as OrderFormField["kind"], fieldKey: r.field_key,
  labelEs: r.label_es, labelEn: r.label_en ?? r.label_es, placeholderEs: r.placeholder_es, placeholderEn: r.placeholder_en, required: r.required,
  validation: r.validation_rules ?? {}, options: (Array.isArray(r.options) ? r.options : []) as OrderFormField["options"],
  conditionalOn: (r.conditional_on ?? null) as OrderFormField["conditionalOn"],
  groupName: r.group_name, groupDescriptionEs: r.group_description_es, groupDescriptionEn: r.group_description_en,
});

export const ordersPublicRepository = {
  // Resuelve item.form_id > default vía RPC DEFINER (las tablas del catálogo tienen RLS tenant_id=current_tenant(),
  // null en anon → un select directo devolvía 0 filas y caía siempre al default). Los forms/fields sí son anon-legibles.
  async resolveForm(kind: string, itemId: string): Promise<OrderForm | null> {
    const { data: fid } = await supabase.rpc("_public_resolve_form_id", { _hostname: window.location.hostname, _kind: kind, _item_id: itemId });
    const formId = fid as string | null;
    if (!formId) return null;
    const { data: f } = await supabase.from("tenant_order_forms").select("id,name,submit_button_label_es,submit_button_label_en,cancel_button_label_es,cancel_button_label_en,show_summary,summary_footer_es,summary_footer_en").eq("id", formId).maybeSingle();
    const form = f as FormRow | null;
    if (!form) return null;
    const { data: fd } = await supabase.from("tenant_order_form_fields").select("id,order_index,kind,field_key,label_es,label_en,placeholder_es,placeholder_en,required,validation_rules,options,conditional_on,group_name,group_description_es,group_description_en").eq("form_id", formId).order("order_index");
    return { id: form.id, name: form.name, fields: ((fd ?? []) as FieldRow[]).map(toField),
      submitLabelEs: form.submit_button_label_es, submitLabelEn: form.submit_button_label_en,
      cancelLabelEs: form.cancel_button_label_es, cancelLabelEn: form.cancel_button_label_en,
      showSummary: form.show_summary ?? true, summaryFooterEs: form.summary_footer_es, summaryFooterEn: form.summary_footer_en };
  },
  async paymentMethods(): Promise<PaymentOption[]> {
    const { data } = await supabase.from("tenant_payment_methods").select("method_key,display_name,config").eq("is_active", true).order("display_order");
    return ((data ?? []) as { method_key: string; display_name: { es?: string; en?: string }; config: { instructions_es?: string; instructions_en?: string; ath_number?: string } }[])
      .map((m) => ({ methodKey: m.method_key, nameEs: m.display_name?.es ?? m.method_key, nameEn: m.display_name?.en ?? m.method_key,
        instructionsEs: m.config?.instructions_es ?? "", instructionsEn: m.config?.instructions_en ?? "", athNumber: m.config?.ath_number ?? null }));
  },
  async pricingRules(): Promise<PricingRules> {
    const { data } = await supabase.from("tenant_pricing_rules").select("rule_type,config").eq("is_active", true);
    const rows = (data ?? []) as { rule_type: string; config: Record<string, unknown> }[];
    const m = rows.find((r) => r.rule_type === "matrix_2d")?.config as { axis_x?: { values: string[] }; axis_y?: { values: number[] }; matrix?: number[][] } | undefined;
    const a = rows.find((r) => r.rule_type === "flat" && (r.config as { kind?: string }).kind === "addons")?.config as { extraLids?: number; extraRegularBins?: number; hydroJet?: number } | undefined;
    const tax = rows.find((r) => r.rule_type === "tax")?.config as { percentage?: number } | undefined;
    const ship = rows.find((r) => r.rule_type === "shipping")?.config as { amount?: number } | undefined;
    return {
      matrix: m?.matrix ? { freqs: m.axis_x?.values ?? [], bins: m.axis_y?.values ?? [], grid: m.matrix } : null,
      addons: a ? { extraLids: a.extraLids ?? 0, extraRegularBins: a.extraRegularBins ?? 0, hydroJet: a.hydroJet ?? 0 } : null,
      taxPct: tax?.percentage ?? 0, shipping: ship?.amount ?? 0,
    };
  },
  async create(input: CreateOrderInput): Promise<{ status?: string; code?: string; order_number?: string; order_id?: string; errors?: { field: string; error: string }[] } | null> {
    const payload = {
      form_id: input.formId, idempotency_key: crypto.randomUUID(), items: input.items,
      custom_fields: input.customFields, payment_method_key: input.paymentMethodKey,
      coupon_code: input.couponCode ?? undefined, client_total: input.clientTotal,
      user_agent: navigator.userAgent, referrer: document.referrer || undefined,
    };
    const { data } = await supabase.rpc("_public_create_order", { _hostname: window.location.hostname, _payload: payload, _client_ip: null });
    return data as { status?: string; code?: string; order_number?: string; order_id?: string } | null;
  },
  async confirmAthSent(orderId: string): Promise<boolean> {
    const { data } = await supabase.rpc("_public_confirm_ath_movil_sent", { _hostname: window.location.hostname, _order_id: orderId, _idempotency_key: crypto.randomUUID(), _client_ip: null });
    return (data as { status?: string } | null)?.status === "ok";
  },
};
