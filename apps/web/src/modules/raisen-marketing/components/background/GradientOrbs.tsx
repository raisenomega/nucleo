import { useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";

// 2 orbes radial-gradient + halo cónico. Parallax de mouse (useMotionValue → useSpring → useTransform).
export function GradientOrbs() {
  const reduced = useReducedMotion();
  const mx = useMotionValue(0), my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 50, damping: 20 });
  const sy = useSpring(my, { stiffness: 50, damping: 20 });
  const o1x = useTransform(sx, [-500, 500], [-40, 40]);
  const o1y = useTransform(sy, [-500, 500], [-40, 40]);
  const o2x = useTransform(sx, [-500, 500], [30, -30]);
  const o2y = useTransform(sy, [-500, 500], [30, -30]);
  useEffect(() => {
    if (reduced) return;
    const onMove = (e: MouseEvent) => { mx.set(e.clientX - window.innerWidth / 2); my.set(e.clientY - window.innerHeight / 2); };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [reduced, mx, my]);
  const orb1 = "radial-gradient(circle, rgba(var(--rm-violet),0.25), transparent 70%)";
  const orb2 = "radial-gradient(circle, rgba(var(--rm-cyan),0.2), transparent 70%)";
  const halo = "conic-gradient(from 0deg, transparent 70%, rgba(var(--rm-violet),0.08) 80%, transparent 90%)";
  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.div className="absolute left-1/3 top-1/4 h-[500px] w-[500px] rounded-full"
        style={{ background: orb1, x: reduced ? 0 : o1x, y: reduced ? 0 : o1y }}
        animate={reduced ? undefined : { scale: [1, 1.15, 1] }}
        transition={reduced ? undefined : { duration: 8, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className="absolute bottom-1/4 right-1/3 h-[400px] w-[400px] rounded-full"
        style={{ background: orb2, x: reduced ? 0 : o2x, y: reduced ? 0 : o2y }}
        animate={reduced ? undefined : { scale: [1.1, 1, 1.1] }}
        transition={reduced ? undefined : { duration: 10, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className="absolute left-1/2 top-1/2 h-[700px] w-[700px] rounded-full"
        style={{ background: halo, marginLeft: -350, marginTop: -350 }}
        animate={reduced ? undefined : { rotate: 360 }}
        transition={reduced ? undefined : { duration: 30, repeat: Infinity, ease: "linear" }} />
    </div>
  );
}
