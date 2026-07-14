import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@shared/i18n";

const BTN = "absolute top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[color:var(--glass-border)] bg-[var(--glass-bg)] opacity-60 backdrop-blur transition-opacity hover:opacity-100 md:flex";

// Prev/next sutiles, solo desktop (mobile usa swipe + dots).
export function CarouselControls({ onPrev, onNext }: { onPrev: () => void; onNext: () => void }) {
  const { t } = useI18n();
  return (
    <>
      <button type="button" onClick={onPrev} aria-label={t("lpCarouselPrev")} className={`${BTN} left-1`}><ChevronLeft className="h-5 w-5" /></button>
      <button type="button" onClick={onNext} aria-label={t("lpCarouselNext")} className={`${BTN} right-1`}><ChevronRight className="h-5 w-5" /></button>
    </>
  );
}
