import { motion } from "framer-motion";

const PRIMARY_BG = "linear-gradient(135deg, rgba(var(--rm-violet),0.9), rgba(var(--rm-cyan),0.9))";
const scrollToForm = () => document.getElementById("lead-form")?.scrollIntoView({ behavior: "smooth" });

// 2 CTAs con hover scale + tap. Primario gradiente violet→cyan + glow; secundario glass.
export function HeroCTAs({ primary, secondary }: { primary: string; secondary: string }) {
  return (
    <motion.div className="flex flex-wrap items-center justify-center gap-4"
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.9 }}>
      <motion.button type="button" onClick={scrollToForm} whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }}
        style={{ background: PRIMARY_BG, boxShadow: "0 0 40px rgba(var(--rm-violet),0.4)" }}
        className="rounded-2xl px-8 py-4 text-sm font-semibold text-white">{primary}</motion.button>
      <motion.button type="button" onClick={scrollToForm} whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }}
        className="rounded-2xl border border-white/[0.12] bg-white/[0.04] px-8 py-4 text-sm font-medium text-white/80 backdrop-blur-[20px]">{secondary}</motion.button>
    </motion.div>
  );
}
