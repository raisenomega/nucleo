import { motion } from "framer-motion";

type Stat = { value: string; label: string };

// Grid de 3 stats glass con hover lift.
export function HeroStats({ stats }: { stats: Stat[] }) {
  return (
    <motion.div className="mx-auto grid max-w-lg grid-cols-3 gap-4"
      initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 1.1 }}>
      {stats.map((s, i) => (
        <motion.div key={i} whileHover={{ y: -4, scale: 1.03 }}
          className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 backdrop-blur-[10px]">
          <div className="text-xl font-bold text-white">{s.value}</div>
          <div className="text-xs text-white/40">{s.label}</div>
        </motion.div>
      ))}
    </motion.div>
  );
}
