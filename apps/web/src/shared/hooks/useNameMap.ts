import { useEffect, useState } from "react";
import { supabase } from "@shared/lib/supabase";

// Map cacheado user_id -> full_name (para tooltips de auditoría, ej. quién anuló).
// RLS-scoped: cada quien lee los profiles que puede; si falta, devuelve "".
export function useNameMap(): (id: string | null) => string {
  const [map, setMap] = useState<Record<string, string>>({});
  useEffect(() => {
    void supabase.from("profiles").select("id,full_name").then(({ data }) => {
      const m: Record<string, string> = {};
      for (const p of (data as { id: string; full_name: string }[] | null) ?? []) m[p.id] = p.full_name;
      setMap(m);
    });
  }, []);
  return (id) => (id ? map[id] ?? "" : "");
}
