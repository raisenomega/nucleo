import { useRef, useState } from "react";
import { useI18n } from "@shared/i18n";

// Canvas de firma (mouse + touch vía pointer events). Emite la firma como data URL PNG al soltar;
// "" al limpiar. Fondo blanco tipo papel + trazo negro (visible en claro y oscuro).
export function SignaturePad({ onChange }: { onChange: (dataUrl: string) => void }) {
  const { t } = useI18n();
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [dirty, setDirty] = useState(false);
  const pos = (e: React.PointerEvent) => {
    const c = ref.current; if (!c) return { x: 0, y: 0 };
    const r = c.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) };
  };
  const start = (e: React.PointerEvent) => {
    const c = ref.current; const ctx = c?.getContext("2d"); if (!c || !ctx) return;
    const p = pos(e); drawing.current = true; ctx.beginPath(); ctx.moveTo(p.x, p.y); c.setPointerCapture(e.pointerId);
  };
  const move = (e: React.PointerEvent) => {
    const ctx = ref.current?.getContext("2d"); if (!drawing.current || !ctx) return;
    const p = pos(e); ctx.lineTo(p.x, p.y); ctx.strokeStyle = "black"; ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.stroke(); setDirty(true);
  };
  const end = () => { if (!drawing.current || !ref.current) return; drawing.current = false; onChange(ref.current.toDataURL("image/png")); };
  const clear = () => { const c = ref.current; c?.getContext("2d")?.clearRect(0, 0, c.width, c.height); setDirty(false); onChange(""); };
  return (
    <div className="space-y-1">
      <span className="text-xs font-bold text-muted-foreground">{t("signature")}</span>
      <canvas ref={ref} width={400} height={120} onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end}
        className="w-full touch-none rounded-lg border border-border bg-white" />
      {dirty && <button type="button" onClick={clear} className="text-xs text-muted-foreground underline">{t("clearSignature")}</button>}
    </div>
  );
}
