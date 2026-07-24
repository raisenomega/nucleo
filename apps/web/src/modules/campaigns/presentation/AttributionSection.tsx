// R2 · muestra el origen de un lead de campaña en los inboxes (tenant /leads y superadmin /web/leads):
// badge "vino de campaña" + desglose de la atribución fina (utm_* + fbclid/gclid + referrer). Reutilizable.
const ROWS: { key: string; label: string }[] = [
  { key: "utm_source", label: "Fuente" }, { key: "utm_medium", label: "Medio" }, { key: "utm_campaign", label: "Campaña" },
  { key: "utm_content", label: "Contenido" }, { key: "utm_term", label: "Término" },
  { key: "fbclid", label: "Meta (fbclid)" }, { key: "gclid", label: "Google (gclid)" }, { key: "referrer", label: "Referrer" },
];

export function AttributionSection({ attribution, fromCampaign }: { attribution: Record<string, string> | null; fromCampaign: boolean }) {
  if (!fromCampaign && !attribution) return null;
  const a = attribution ?? {};
  const rows = ROWS.filter((r) => a[r.key]);
  return (
    <div className="space-y-2">
      {fromCampaign && <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-bold text-primary">Vino de una campaña</span>}
      {rows.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="mb-1 text-xs font-bold uppercase text-muted-foreground">Atribución</p>
          {rows.map((r) => <div key={r.key} className="flex justify-between gap-2 border-t border-border py-1 text-sm"><span className="shrink-0 text-muted-foreground">{r.label}</span><span className="min-w-0 truncate font-medium text-foreground">{a[r.key]}</span></div>)}
        </div>
      )}
    </div>
  );
}
