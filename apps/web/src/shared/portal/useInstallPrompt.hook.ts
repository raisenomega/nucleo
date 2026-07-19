import { useEffect, useState } from "react";

interface BIPEvent extends Event { prompt: () => Promise<void> }

// Captura el evento beforeinstallprompt (Chrome/Android) para ofrecer instalar la PWA del portal.
export function useInstallPrompt() {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  useEffect(() => {
    const h = (e: Event) => { e.preventDefault(); setEvt(e as BIPEvent); };
    window.addEventListener("beforeinstallprompt", h);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);
  const install = () => { if (evt) { void evt.prompt(); setEvt(null); } };
  return { canInstall: !!evt, install };
}
