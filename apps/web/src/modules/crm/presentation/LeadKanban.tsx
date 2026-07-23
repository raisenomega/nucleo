import { useEffect, useState } from "react";
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { useI18n } from "@shared/i18n";
import { supabaseLeadActivityRepository as actRepo } from "@crm/infrastructure/supabase-lead-activity.repository";
import { STATUSES } from "@crm/presentation/lead.constants";
import { KanbanColumn } from "@crm/presentation/KanbanColumn";
import { LeadPipelineMetrics } from "@crm/presentation/LeadPipelineMetrics";
import type { Lead } from "@crm/domain/lead.types";
import type { LeadCardMeta } from "@crm/domain/lead-activity.types";

const TERMINAL = ["converted", "lost"];

// Vista pipeline: 3 columnas activas + 2 zonas de salida (terminales). Drag entre columnas → onMove (UPDATE + log).
export function LeadKanban({ leads, onCardClick, onMove }: {
  leads: Lead[]; onCardClick: (id: string) => void; onMove: (lead: Lead, status: string) => void;
}) {
  const { t } = useI18n();
  const [meta, setMeta] = useState<Record<string, LeadCardMeta>>({});
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  useEffect(() => { void actRepo.cardMeta(leads.map((l) => l.id)).then(setMeta); }, [leads]);
  const onDragEnd = (e: DragEndEvent) => {
    const lead = leads.find((l) => l.id === e.active.id); const to = e.over?.id as string | undefined;
    if (lead && to && lead.status !== to) onMove(lead, to);
  };
  const col = (s: (typeof STATUSES)[number]) => (
    <KanbanColumn key={s.value} status={s.value} label={t(s.key)} color={s.color} terminal={TERMINAL.includes(s.value)}
      leads={leads.filter((l) => l.status === s.value)} metaMap={meta} onCardClick={onCardClick} onMove={onMove} />
  );
  return (
    <div>
      <LeadPipelineMetrics leads={leads} />
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="flex gap-2 overflow-x-auto pb-2">{STATUSES.filter((s) => !TERMINAL.includes(s.value)).map(col)}</div>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-2">{STATUSES.filter((s) => TERMINAL.includes(s.value)).map(col)}</div>
      </DndContext>
    </div>
  );
}
