import { motion } from "framer-motion";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

// Título hero: cada palabra entra animada (y + rotateX). Las palabras en `gradient` van en degradado violet→cyan.
export function HeroTitle({ text, gradient }: { text: string; gradient: number[] }) {
  const words = text.split(" ");
  return (
    <h1 className="text-5xl font-black leading-none tracking-tighter text-white sm:text-7xl md:text-9xl" style={{ perspective: 800 }}>
      {words.map((w, i) => (
        <motion.span key={i} className="mr-[0.25em] inline-block"
          initial={{ opacity: 0, y: 60, rotateX: -40 }} animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.8, delay: 0.1 + i * 0.1, ease: EASE }}>
          {gradient.includes(i)
            ? <span className="bg-gradient-to-br from-violet-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">{w}</span>
            : w}
        </motion.span>
      ))}
    </h1>
  );
}
