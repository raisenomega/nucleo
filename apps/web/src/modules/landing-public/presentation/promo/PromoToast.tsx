import { Sparkles } from "lucide-react";
import { m } from "@landing-public/motion/motion-loader";

// Badge flotante persistente (esquina inferior derecha) que reabre el popup de la oferta. Slide-in desde la derecha.
export function PromoToast({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <m.button type="button" onClick={onClick} initial={{ x: 120, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
      className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-[color:hsl(var(--tenant-accent-hsl))] px-4 py-2.5 text-sm font-bold text-white shadow-lg">
      <Sparkles className="h-4 w-4" /> {text}
    </m.button>
  );
}
