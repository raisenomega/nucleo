import { useEffect, useRef, useState } from "react";
import { X, ScanBarcode } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";

type Detector = { detect: (src: HTMLVideoElement) => Promise<{ rawValue: string }[]> };
const getCtor = () => (typeof window === "undefined" ? undefined : (window as unknown as { BarcodeDetector?: new () => Detector }).BarcodeDetector);

// Escáner: usa BarcodeDetector nativo (Android/Chrome). Donde no exista (ej. iOS Safari) → entrada manual.
export function BarcodeScanner({ onDetected, onClose }: { onDetected: (code: string) => void; onClose: () => void }) {
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const Ctor = getCtor();
  useEffect(() => {
    if (!Ctor) return;
    let stream: MediaStream | null = null; let stop = false; let timer = 0;
    const detector = new Ctor();
    void (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      } catch { setError(t("cameraPermissionDenied")); return; }
      const scan = async () => {
        if (stop || !videoRef.current) return;
        try { const codes = await detector.detect(videoRef.current); if (codes[0]?.rawValue) return onDetected(codes[0].rawValue); } catch { /* frame sin código */ }
        timer = window.setTimeout(() => void scan(), 400);
      };
      void scan();
    })();
    return () => { stop = true; window.clearTimeout(timer); stream?.getTracks().forEach((tr) => tr.stop()); };
  }, [Ctor, onDetected, t]);
  const showManual = !Ctor || error;
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-foreground"><ScanBarcode className="h-5 w-5" />{t("scanBarcode")}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <div className="space-y-3 p-4">
        {Ctor && !error && <><video ref={videoRef} className="w-full rounded-lg bg-black" muted playsInline /><p className="text-center text-sm text-muted-foreground">{t("pointCameraAtBarcode")}</p></>}
        {error && <p className="text-center text-sm text-destructive">{error}</p>}
        {showManual && (
          <form onSubmit={(e) => { e.preventDefault(); if (manual.trim()) onDetected(manual.trim()); }} className="flex gap-2">
            <input value={manual} onChange={(e) => setManual(e.target.value)} placeholder={t("barcode")} className="w-full rounded-lg border border-border bg-background p-2" autoFocus />
            <button type="submit" className="shrink-0 rounded-lg bg-primary text-primary-foreground px-4 font-bold">OK</button>
          </form>
        )}
      </div>
    </ScreenModal>
  );
}
