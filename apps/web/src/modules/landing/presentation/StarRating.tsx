import { Star } from "lucide-react";

// Rating 1-5. Con onChange = editable (clickeable); sin onChange = display-only.
export function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const ro = !onChange;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" disabled={ro} onClick={() => onChange?.(n)} aria-label={`${n}`} className={ro ? "cursor-default" : "cursor-pointer"}>
          <Star className={`h-5 w-5 ${n <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"}`} />
        </button>))}
    </div>
  );
}
