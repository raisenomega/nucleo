import { Star } from "lucide-react";
import type { BlockContent } from "@campaigns/domain/campaign.types";

type T = { quote?: string; name?: string; role?: string; avatar_url?: string; rating?: number | string };

// Cards de testimonio: quote itálica + avatar (foto o inicial) + estrellas. Stars con vars del tema (no --lp-*).
export function TestimonialsBlock({ content }: { content: BlockContent }) {
  const items = (Array.isArray(content.items) ? content.items : []) as T[];
  if (items.length === 0) return null;
  return (
    <section className="camp-tst"><div className="camp-tst-grid">
      {items.map((t, i) => (
        <div key={i} className="camp-tst-card">
          {t.rating != null && t.rating !== "" && <div className="camp-stars">{[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`camp-star ${n <= Number(t.rating) ? "camp-star-on" : ""}`} />)}</div>}
          {t.quote && <p className="camp-tst-quote">“{t.quote}”</p>}
          <div className="camp-tst-who">
            {t.avatar_url ? <img src={t.avatar_url} alt="" loading="lazy" className="camp-tst-av" /> : <span className="camp-tst-ini">{(t.name ?? "?").charAt(0).toUpperCase()}</span>}
            <div><p className="camp-tst-name">{t.name}</p>{t.role && <p className="camp-tst-role">{t.role}</p>}</div>
          </div>
        </div>
      ))}
    </div></section>
  );
}
