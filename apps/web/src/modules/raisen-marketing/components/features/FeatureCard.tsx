import { motion } from "framer-motion";
import { FileText, Route, Bot, BarChart3, Globe, Users, Zap, type LucideIcon } from "lucide-react";
import type { MarketingFeature } from "@raisen-marketing/data/features";
import type { Lang } from "@raisen-marketing/data/copy";

// Mapa de iconos por nombre (solo los usados → chunk liviano; en el CMS futuro se hará dinámico full).
const ICONS: Record<string, LucideIcon> = { FileText, Route, Bot, BarChart3, Globe, Users };

// Card del bento grid: icono Lucide + título + descripción. Entrada whileInView + hover lift. colSpan 2 → ancha.
export function FeatureCard({ feature, index, lang }: { feature: MarketingFeature; index: number; lang: Lang }) {
  const Icon = ICONS[feature.icon] ?? Zap;
  const title = lang === "es" ? feature.titleEs : feature.titleEn;
  const desc = lang === "es" ? feature.descriptionEs : feature.descriptionEn;
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }} whileHover={{ y: -4, scale: 1.01 }}
      className={`rounded-2xl border border-white/[0.08] bg-white/[0.03] p-7 backdrop-blur-sm transition-colors hover:border-white/20 hover:bg-white/[0.06] ${feature.colSpan === 2 ? "md:col-span-2" : ""}`}>
      <Icon className="h-6 w-6 text-violet-400" />
      <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-white/50">{desc}</p>
    </motion.div>
  );
}
