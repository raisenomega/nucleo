import { useEffect, useState } from "react";
import type { BlockContent } from "@campaigns/domain/campaign.types";

const s = (c: BlockContent, k: string) => (typeof c[k] === "string" ? (c[k] as string) : "");
function parts(target: number, now: number) {
  const sec = Math.max(0, Math.floor((target - now) / 1000));
  return { d: Math.floor(sec / 86400), h: Math.floor((sec % 86400) / 3600), m: Math.floor((sec % 3600) / 60), s: sec % 60, done: target - now <= 0 };
}

// SSR-safe: `now` arranca null → SSR y primer render de cliente muestran 00:00 (IDÉNTICOS, sin hydration mismatch).
// El timer se monta recién en useEffect. `target` viene del content (determinista), así que no rompe el SSR.
export function CountdownBlock({ content }: { content: BlockContent }) {
  const target = new Date(s(content, "target_date") || 0).getTime();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  if (now !== null && parts(target, now).done) return <section className="camp-countdown"><p className="camp-cd-exp">{s(content, "expired_text") || "Esta oferta ha terminado."}</p></section>;
  const p = now === null ? { d: 0, h: 0, m: 0, s: 0 } : parts(target, now);
  const box = (n: number, l: string) => <div className="camp-cd-box"><span className="camp-cd-num">{String(n).padStart(2, "0")}</span><span className="camp-cd-lbl">{l}</span></div>;
  return (
    <section className="camp-countdown">
      {s(content, "headline") && <p className="camp-cd-head">{s(content, "headline")}</p>}
      <div className="camp-cd-grid">{box(p.d, "días")}{box(p.h, "hrs")}{box(p.m, "min")}{box(p.s, "seg")}</div>
    </section>
  );
}
