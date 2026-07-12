import { supabase } from "@shared/lib/supabase";
import { toFullForm, toFieldRow, type FieldRow, type FormRow } from "@order-forms/infrastructure/order-form.mapper";
import type { EditorField } from "@order-forms/domain/order-form-field.types";
import type { IOrderFormsRepository, OrderFormSummary, Result } from "@order-forms/domain/order-form.types";

const FSEL = "id,order_index,kind,field_key,label_es,label_en,placeholder_es,placeholder_en,required,group_name,validation_rules,options,conditional_on";
const ok = (e: { message: string } | null): Result => (e ? { ok: false, error: e.message } : { ok: true });

export const supabaseOrderFormsRepository: IOrderFormsRepository = {
  async list() {
    const { data } = await supabase.from("tenant_order_forms")
      .select("id,name,description,is_default,applies_to_kind,created_at,tenant_order_form_fields(count)").order("created_at");
    return ((data ?? []) as unknown as (FormRow & { created_at: string; tenant_order_form_fields: { count: number }[] })[]).map((f): OrderFormSummary => ({
      id: f.id, name: f.name, description: f.description ?? "", isDefault: f.is_default, appliesToKind: f.applies_to_kind,
      fieldCount: f.tenant_order_form_fields?.[0]?.count ?? 0, createdAt: f.created_at,
    }));
  },
  async get(id) {
    const { data: f } = await supabase.from("tenant_order_forms").select("id,name,description,is_default,applies_to_kind").eq("id", id).maybeSingle();
    if (!f) return null;
    const { data: fields } = await supabase.from("tenant_order_form_fields").select(FSEL).eq("form_id", id).order("order_index");
    return toFullForm(f as FormRow, (fields ?? []) as FieldRow[]);
  },
  async create(tenantId, name, description) {
    const { data } = await supabase.from("tenant_order_forms").insert({ tenant_id: tenantId, name, description: description || null }).select("id").single();
    return (data as { id: string } | null)?.id ?? null;
  },
  async saveForm(id, name, description) {
    return ok((await supabase.from("tenant_order_forms").update({ name, description: description || null }).eq("id", id)).error);
  },
  async saveFields(tenantId, formId, fields, deletedIds) {
    if (deletedIds.length) { const { error } = await supabase.from("tenant_order_form_fields").delete().in("id", deletedIds); if (error) return ok(error); }
    if (!fields.length) return { ok: true };
    return ok((await supabase.from("tenant_order_form_fields").upsert(fields.map((f) => toFieldRow(tenantId, formId, f)), { onConflict: "id" })).error);
  },
  async duplicate(tenantId, id) {
    const orig = await this.get(id); if (!orig) return null;
    const newId = await this.create(tenantId, `${orig.name} - copia`, orig.description); if (!newId) return null;
    const clones: EditorField[] = orig.fields.map((f) => ({ ...f, id: crypto.randomUUID() }));
    await this.saveFields(tenantId, newId, clones, []);
    return newId;
  },
  async remove(id) { return ok((await supabase.from("tenant_order_forms").delete().eq("id", id)).error); },
  async setDefault(id) {
    const { data } = await supabase.from("tenant_order_forms").select("tenant_id").eq("id", id).single();
    const tid = (data as { tenant_id: string } | null)?.tenant_id;
    if (tid) await supabase.from("tenant_order_forms").update({ is_default: false }).eq("tenant_id", tid);
    return ok((await supabase.from("tenant_order_forms").update({ is_default: true }).eq("id", id)).error);
  },
};
