import { useCallback, useEffect, useRef, useState } from "react";
import { getPlatform, isStandalone } from "@landing-public/pwa/detectPlatform";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

// Captura beforeinstallprompt (Chromium) en un ref (siempre vivo, sin stale-closure), detecta iOS y "ya instalada".
export function useInstallPrompt() {
  const deferred = useRef<BIPEvent | null>(null);
  const [ready, setReady] = useState(false);
  const [installed, setInstalled] = useState(false);
  const isIOS = getPlatform() === "ios-safari";
  useEffect(() => {
    if (isStandalone()) setInstalled(true);
    const onBIP = (e: Event) => { e.preventDefault(); deferred.current = e as BIPEvent; setReady(true); };
    const onInstalled = () => { setInstalled(true); deferred.current = null; setReady(false); };
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  const promptInstall = useCallback(async () => {
    const e = deferred.current;
    if (!e) return;
    await e.prompt(); // invocado dentro del gesto del usuario (antes de cualquier await asíncrono previo)
    await e.userChoice;
    deferred.current = null; setReady(false);
  }, []);
  return { canInstall: !installed && (isIOS || ready), ready, isIOS, isInstalled: installed, promptInstall, dismissPrompt: () => { deferred.current = null; setReady(false); } };
}
