import { useEffect, useRef, useState } from "react";

interface Sentinel { release: () => Promise<void>; addEventListener: (t: string, cb: () => void) => void }
type WL = { request: (t: string) => Promise<Sentinel> } | undefined;
const getWL = (): WL => (typeof navigator === "undefined" ? undefined : (navigator as unknown as { wakeLock?: WL }).wakeLock);

export interface WakeState { supported: boolean; active: boolean }

// Mantiene la pantalla encendida mientras el GPS rastrea (Android PWA). iOS no lo soporta. NO toca el tracking.
export function useWakeLock(enabled: boolean): WakeState {
  const [active, setActive] = useState(false);
  const ref = useRef<Sentinel | null>(null);
  const supported = !!getWL();
  useEffect(() => {
    if (!enabled || !supported) return;
    let cancelled = false;
    const acquire = async () => {
      try {
        const s = await getWL()!.request("screen");
        if (cancelled) { void s.release(); return; }
        ref.current = s; setActive(true);
        s.addEventListener("release", () => { ref.current = null; setActive(false); }); // el SO libera al ocultar la pestaña
      } catch { setActive(false); }
    };
    void acquire();
    const onVis = () => { if (document.visibilityState === "visible" && !ref.current) void acquire(); }; // re-adquiere al volver
    document.addEventListener("visibilitychange", onVis);
    return () => { cancelled = true; document.removeEventListener("visibilitychange", onVis); const l = ref.current; ref.current = null; if (l) void l.release(); setActive(false); };
  }, [enabled, supported]);
  return { supported, active };
}
