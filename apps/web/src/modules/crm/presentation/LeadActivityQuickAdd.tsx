import { useState } from "react";
import { Phone, Mail, StickyNote, CheckSquare, Users, MessageCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ActivityKind } from "@crm/domain/lead-activity.types";

const KINDS: { kind: ActivityKind; icon: LucideIcon; label: string }[] = [
  { kind: "call", icon: Phone, label: "Llamada" }, { kind: "note", icon: StickyNote, label: "Nota" },
  { kind: "task", icon: CheckSquare, label: "Tarea" }, { kind: "email", icon: Mail, label: "Email" },
  { kind: "whatsapp", icon: MessageCircle, label: "WhatsApp" }, { kind: "meeting", icon: Users, label: "Reunión" },
];

// Quick-add de actividad: elegir tipo → input inline (+ fecha si es tarea). Enter agrega.
export function LeadActivityQuickAdd({ onAdd }: { onAdd: (kind: ActivityKind, body: string, dueDate?: string) => void }) {
  const [kind, setKind] = useState<ActivityKind | null>(null);
  const [body, setBody] = useState("");
  const [due, setDue] = useState("");
  const submit = () => {
    if (!kind || (kind === "task" && !due)) return;
    onAdd(kind, body.trim(), kind === "task" ? due : undefined);
    setKind(null); setBody(""); setDue("");
  };
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">{KINDS.map((k) => (
        <button key={k.kind} type="button" onClick={() => setKind(kind === k.kind ? null : k.kind)}
          className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold ${kind === k.kind ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
          <k.icon className="h-3.5 w-3.5" />{k.label}</button>))}</div>
      {kind && (
        <div className="flex flex-wrap items-center gap-2">
          <input autoFocus value={body} onChange={(e) => setBody(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            placeholder={kind === "task" ? "Qué hay que hacer…" : "Detalle…"} className="min-w-[10rem] flex-1 rounded-lg border border-border bg-background p-2 text-sm" />
          {kind === "task" && <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="rounded-lg border border-border bg-background p-2 text-sm" />}
          <button type="button" disabled={kind === "task" && !due} onClick={submit} className="rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-bold disabled:opacity-50">Agregar</button>
        </div>)}
    </div>
  );
}
