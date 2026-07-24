import { useEffect, useState } from "react";
import { supabase } from "@shared/lib/supabase";

// R5 · dominio PÚBLICO del tenant = primer allowed_origin (no www/staging). NO primary_domain (ese es el panel,
// app.X). La RLS scopea `tenants` al tenant de la sesión, así que basta select ... limit 1.
export function useTenantPublicHost(): string {
  const [host, setHost] = useState("");
  useEffect(() => {
    void supabase.from("tenants").select("allowed_origins").limit(1).then(({ data }) => {
      const o = ((data as { allowed_origins: string[] | null }[] | null)?.[0]?.allowed_origins) ?? [];
      const pick = o.find((x) => !/^(https?:\/\/)?(www\.|staging\.)/.test(x)) ?? o[0] ?? "";
      setHost(pick.replace(/^https?:\/\//, "").replace(/\/.*$/, ""));
    });
  }, []);
  return host;
}
