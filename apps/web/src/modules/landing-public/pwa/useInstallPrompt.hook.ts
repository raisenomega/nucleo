import { useEffect, useState } from "react";
import { getPlatform, isStandalone } from "@landing-public/pwa/detectPlatform";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

// Captura beforeinstallprompt (Chromium), detecta iOS y "ya instalada". Cleanup de listeners en unmount.
export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const isIOS = getPlatform() === "ios-safari";
  useEffect(() => {
    if (isStandalone()) setInstalled(true);
    const onBIP = (e: Event) => { e.preventDefault(); setDeferred(e as BIPEvent); };
    const onInstalled = () => { setInstalled(true); setDeferred(null); };
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  async function promptInstall() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  }
  return { canInstall: !installed && (isIOS || deferred !== null), isIOS, isInstalled: installed, promptInstall, dismissPrompt: () => setDeferred(null) };
}
