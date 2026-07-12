import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { useSession } from "@shared/providers/SessionProvider";
import { useLeadsQuickSearch } from "@agenda/application/useLeadsQuickSearch.hook";
import { supabaseLeadsLiteRepository } from "@agenda/infrastructure/supabase-leads-lite.repository";
import type { LeadLite } from "@agenda/domain/leads-lite.types";

export function LeadPickerSection({ leadId, leadName, onPick }: { leadId: string | null; leadName: string; onPick: (lead: LeadLite | null) => void }) {
  const { t } = useI18n();
  const { session } = useSession();
  const { results, search, create } = useLeadsQuickSearch(supabaseLeadsLiteRepository, session?.tenantId ?? null, session?.userId ?? "");
  const [q, setQ] = useState(""); const [creating, setCreating] = useState(false);
  const [nn, setNn] = useState(""); const [np, setNp] = useState(""); const [ne, setNe] = useState("");
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  async function doCreate() { const l = await create(nn, np, ne); if (l) { onPick(l); setCreating(false); } }
  if (leadId) return <div className="flex items-center gap-2 text-sm"><span className="rounded bg-secondary px-2 py-1">{leadName}</span><button type="button" onClick={() => onPick(null)} className="text-destructive">×</button></div>;
  return (
    <div className="space-y-2">
      <input value={q} onChange={(e) => { setQ(e.target.value); void search(e.target.value); }} placeholder={t("agendaLeadSearch")} className={fld} />
      {results.length > 0 && <ul className="rounded-lg border border-border">{results.map((r) => <li key={r.id}><button type="button" onClick={() => onPick(r)} className="w-full p-2 text-left text-sm hover:bg-secondary">{r.name}</button></li>)}</ul>}
      {!creating ? <button type="button" onClick={() => setCreating(true)} className="text-sm text-foreground underline">+ {t("agendaNewLead")}</button>
        : <div className="space-y-2 rounded-lg border border-border p-2">
            <input value={nn} onChange={(e) => setNn(e.target.value)} placeholder={t("agendaLeadName")} className={fld} />
            <input value={np} onChange={(e) => setNp(e.target.value)} placeholder={t("agendaLeadPhone")} className={fld} />
            <input value={ne} onChange={(e) => setNe(e.target.value)} placeholder={t("agendaLeadEmail")} className={fld} />
            <button type="button" onClick={() => void doCreate()} className="rounded bg-primary px-3 py-1 text-sm font-bold text-primary-foreground">{t("save")}</button>
          </div>}
    </div>
  );
}
