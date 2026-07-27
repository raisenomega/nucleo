import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { supabasePortalRepository } from "@hr/infrastructure/supabase-portal.repository";
import type { MyCert } from "@hr/domain/portal.types";

// Mis certificaciones (get_my_certifications, definer). Marca "por vencer" a ≤30 días.
export function MyCertifications() {
  const { t } = useI18n();
  const [certs, setCerts] = useState<MyCert[]>([]);
  useEffect(() => { void supabasePortalRepository.certs().then(setCerts); }, []);
  const soon = (d: string | null) => d ? (new Date(d).getTime() - Date.now()) / 86400000 <= 30 : false;
  if (certs.length === 0) return null;
  return (
    <section className="space-y-2">
      <h3 className="font-body text-sm font-bold text-foreground">{t("myCertifications")}</h3>
      <table className="w-full text-sm">
        <thead><tr className="border-b border-border text-left text-xs text-muted-foreground">
          <th className="p-2">{t("certName")}</th><th className="p-2">{t("issued")}</th><th className="p-2">{t("expirationDate")}</th><th className="p-2"></th></tr></thead>
        <tbody>{certs.map((c) => (
          <tr key={c.id} className="border-b border-border">
            <td className="p-2 font-semibold">{c.name}</td><td className="p-2">{c.issued ?? "—"}</td><td className="p-2">{c.expires ?? "—"}</td>
            <td className="p-2">{soon(c.expires) ? <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600"><AlertTriangle className="h-3 w-3" /> {t("expiringSoon")}</span>
              : <span className="text-xs font-bold text-green-600">{t("certValid")}</span>}</td></tr>))}</tbody>
      </table>
    </section>
  );
}
