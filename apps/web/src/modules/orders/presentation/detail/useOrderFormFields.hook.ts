import { useEffect, useState } from "react";
import { supabase } from "@shared/lib/supabase";

// Campos del form (por form_id) para resolver labels/options de custom_fields en el detalle de la orden.
export interface DetailField {
  fieldKey: string; kind: string; labelEs: string; labelEn: string | null;
  options: { value: string; label_es: string; label_en: string }[];
  conditionalOn: { field: string; value: string } | null; groupName: string | null;
}

export function useOrderFormFields(formId: string | null): DetailField[] {
  const [fields, setFields] = useState<DetailField[]>([]);
  useEffect(() => {
    if (!formId) { setFields([]); return; }
    void supabase.from("tenant_order_form_fields")
      .select("field_key,kind,label_es,label_en,options,conditional_on,group_name").eq("form_id", formId).order("order_index")
      .then(({ data }) => setFields(((data ?? []) as Array<Record<string, unknown>>).map((r) => ({
        fieldKey: r.field_key as string, kind: r.kind as string, labelEs: r.label_es as string, labelEn: (r.label_en as string) ?? null,
        options: (Array.isArray(r.options) ? r.options : []) as DetailField["options"],
        conditionalOn: (r.conditional_on ?? null) as DetailField["conditionalOn"], groupName: (r.group_name as string) ?? null,
      }))));
  }, [formId]);
  return fields;
}
