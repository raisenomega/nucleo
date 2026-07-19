import { motion } from "framer-motion";

// Pill glass con dot emerald pulsante (scale [1,1.5,1] · opacity [1,0.5,1] · 2s infinito).
export function HeroBadge({ text }: { text: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/80 backdrop-blur-[12px]">
      <motion.span className="h-2 w-2 rounded-full bg-emerald-400"
        animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
      {text}
    </motion.div>
  );
}
