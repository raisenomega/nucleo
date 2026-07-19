import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

type Star = { x: number; y: number; size: number; opacity: number; duration: number };

// 120 estrellas generadas en el cliente (useEffect → evita hydration mismatch). Parpadeo individual 2-6s.
export function StarField() {
  const [stars, setStars] = useState<Star[]>([]);
  const reduced = useReducedMotion();
  useEffect(() => {
    setStars(Array.from({ length: 120 }, () => ({
      x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 2 + 0.5, opacity: Math.random() * 0.7 + 0.1,
      duration: Math.random() * 4 + 2,
    })));
  }, []);
  return (
    <div className="absolute inset-0 overflow-hidden">
      {stars.map((s, i) => (
        <motion.div key={i} className="absolute rounded-full bg-white"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, opacity: s.opacity }}
          animate={reduced ? undefined : { opacity: [s.opacity, s.opacity * 0.2, s.opacity] }}
          transition={reduced ? undefined : { duration: s.duration, repeat: Infinity, ease: "easeInOut" }} />
      ))}
    </div>
  );
}
