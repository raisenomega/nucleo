import { useDroppable } from "@dnd-kit/core";
import { SLOT_PX } from "@agenda/presentation/week-view/grid-consts";

export function WeekViewSlot({ id, onClick }: { id: string; onClick: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return <div ref={setNodeRef} onClick={onClick} style={{ height: SLOT_PX }} className={`cursor-pointer border-t border-border/40 ${isOver ? "bg-primary/10" : ""}`} />;
}
