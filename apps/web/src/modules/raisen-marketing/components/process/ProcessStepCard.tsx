import { motion } from "framer-motion";
import { UserPlus, Palette, LayoutDashboard, TrendingUp, ArrowRight, type LucideIcon } from "lucide-react";
import type { ProcessStep } from "@raisen-marketing/data/process-steps";
import type { Lang } from "@raisen-marketing/data/copy";

const ICONS: Record<string, LucideIcon> = { UserPlus, Palette, LayoutDashboard, TrendingUp };

// Paso del timeline: círculo con número (hover → violet sólido + glow) + título + desc. Línea conectora vertical.
export function ProcessStepCard({ step, index, lang, last }: { step: ProcessStep; index: number; lang: Lang; last: boolean }) {
  const Icon = ICONS[step.icon] ?? ArrowRight;
  const title = lang === "es" ? step.titleEs : step.titleEn;
  const desc = lang === "es" ? step.descriptionEs : step.descriptionEn;
  return (
    <motion.div className="group relative flex gap-5 pb-10" initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }}>
      {!last && <div className="absolute left-5 top-10 h-full w-px bg-white/10" />}
      <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-violet-500/20 bg-[var(--rm-bg)] text-sm font-bold text-violet-400 transition-all group-hover:bg-violet-500 group-hover:text-white group-hover:shadow-[0_0_16px_4px_rgba(139,92,246,0.4)]">
        {step.number}
      </div>
      <div className="pt-1.5">
        <div className="flex items-center gap-2"><Icon className="h-4 w-4 text-violet-400" /><h3 className="font-semibold text-white">{title}</h3></div>
        <p className="mt-1 text-sm text-white/50">{desc}</p>
      </div>
    </motion.div>
  );
}
