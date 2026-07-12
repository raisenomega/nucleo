import { useDraggable } from "@dnd-kit/core";
import { STATUS_COLOR } from "@agenda/presentation/appointment-status.const";
import type { Appointment } from "@agenda/domain/appointment.types";

export function DraggableAppointmentBlock({ apt, top, height, onEdit }: { apt: Appointment; top: number; height: number; onEdit: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: apt.id });
  const style = { top, height, transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined };
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} onClick={onEdit} style={style}
      className={`absolute left-1 right-1 z-10 cursor-grab overflow-hidden rounded px-1 py-0.5 text-[11px] leading-tight text-white ${STATUS_COLOR[apt.status]} ${isDragging ? "opacity-60 ring-2 ring-primary" : ""}`}>
      {apt.title}
    </div>
  );
}
