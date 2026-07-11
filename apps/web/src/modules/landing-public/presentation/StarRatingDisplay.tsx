import { Star } from "lucide-react";

// Estrellas display-only (duplicado ligero del StarRating del panel para no cruzar BC @landing → @landing-public).
export function StarRatingDisplay({ value, size = "sm" }: { value: number; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  return (
    <div className="flex gap-0.5" role="img" aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`${cls} ${n <= value ? "fill-yellow-400 text-yellow-400" : "text-[color:hsl(var(--lp-muted))]/40"}`} />
      ))}
    </div>
  );
}
