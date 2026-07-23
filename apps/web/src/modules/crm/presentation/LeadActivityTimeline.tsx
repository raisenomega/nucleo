import { useCallback, useEffect, useState } from "react";
import { Phone, Mail, StickyNote, CheckSquare, Users, MessageCircle, Trash2, Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { relativeTime } from "@shared/notifications/notif-format";
import { supabaseLeadActivityRepository as repo } from "@crm/infrastructure/supabase-lead-activity.repository";
import { LeadActivityQuickAdd } from "@crm/presentation/LeadActivityQuickAdd";
import type { ActivityKind, LeadActivity } from "@crm/domain/lead-activity.types";

const ICON: Record<ActivityKind, LucideIcon> = { call: Phone, email: Mail, note: StickyNote, task: CheckSquare, meeting: Users, whatsapp: MessageCircle };

// Timeline de actividad del lead + quick-add + links de contacto (tel/mailto/wa.me) que dejan rastro automático.
export function LeadActivityTimeline({ leadId, phone, email }: { leadId: string; phone: string; email: string }) {
  const { locale } = useI18n();
  const [acts, setActs] = useState<LeadActivity[]>([]);
  const load = useCallback(async () => setActs(await repo.list(leadId)), [leadId]);
  useEffect(() => { void load(); }, [load]);
  const add = async (kind: ActivityKind, body: string, dueDate?: string) => { const r = await repo.add(leadId, kind, body, dueDate); if (r.ok) void load(); };
  const complete = async (id: string) => { await repo.complete(id); void load(); };
  const del = async (id: string) => { if (window.confirm("¿Eliminar actividad?")) { await repo.remove(id); void load(); } };
  const contact = (kind: ActivityKind, body: string) => { void repo.logSilently(leadId, kind, body).then(load); };
  const today = new Date().toISOString().slice(0, 10);
  const badge = (a: LeadActivity) => {
    if (a.kind !== "task" || !a.dueDate) return null;
    if (a.doneAt) return <span className="ml-2 font-bold text-green-600">✓ hecha</span>;
    if (a.dueDate < today) return <span className="ml-2 font-bold text-red-600">vencida {a.dueDate}</span>;
    if (a.dueDate === today) return <span className="ml-2 font-bold text-orange-600">hoy</span>;
    return <span className="ml-2 text-muted-foreground">para {a.dueDate}</span>;
  };
  const clink = "flex items-center gap-1 rounded-lg bg-secondary px-2 py-1 text-xs font-bold";
  return (
    <div className="space-y-3 border-t border-border pt-3">
      <h3 className="text-sm font-bold text-foreground">Actividad</h3>
      <div className="flex flex-wrap gap-1">
        {phone && <a href={`tel:${phone}`} onClick={() => contact("call", "Llamada iniciada")} className={clink}><Phone className="h-3.5 w-3.5" />Llamar</a>}
        {phone && <a href={`https://wa.me/${phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" onClick={() => contact("whatsapp", "Contacto por WhatsApp")} className={clink}><MessageCircle className="h-3.5 w-3.5" />WhatsApp</a>}
        {email && <a href={`mailto:${email}`} onClick={() => contact("email", "Email enviado")} className={clink}><Mail className="h-3.5 w-3.5" />Email</a>}
      </div>
      <LeadActivityQuickAdd onAdd={add} />
      <div className="space-y-2">{acts.length === 0 ? <p className="text-xs text-muted-foreground">Sin actividad todavía.</p> : acts.map((a) => {
        const Ic = ICON[a.kind];
        return (
          <div key={a.id} className="flex items-start gap-2 text-sm">
            <Ic className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className={a.doneAt ? "text-muted-foreground line-through" : "text-foreground"}>{a.body || a.kind}</p>
              <p className="text-xs text-muted-foreground">{relativeTime(a.createdAt, locale)}{badge(a)}</p>
            </div>
            {a.kind === "task" && !a.doneAt && <button type="button" onClick={() => void complete(a.id)} aria-label="Completar" className="shrink-0 text-green-600"><Check className="h-4 w-4" /></button>}
            <button type="button" onClick={() => void del(a.id)} aria-label="Eliminar" className="shrink-0 text-destructive"><Trash2 className="h-4 w-4" /></button>
          </div>);
      })}</div>
    </div>
  );
}
