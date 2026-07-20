import "@raisen-marketing/styles/marketing.css";
import ReactMarkdown from "react-markdown";
import { ArrowLeft } from "lucide-react";
import { useMarketingLang } from "@raisen-marketing/hooks/useMarketingLang";
import { useMarketingLegalPage } from "@raisen-marketing/hooks/useMarketingLegalPage";
import { MarketingFooter } from "@raisen-marketing/components/footer/MarketingFooter";

const PROSE = "space-y-4 text-sm leading-relaxed text-white/75 [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white [&_a]:text-primary [&_a]:underline [&_strong]:text-white [&_ul]:list-disc [&_ul]:pl-6";

// Ruta pública /legal/{slug} con el aesthetic de la landing (rm-root, fondo oscuro). Renderiza el contenido
// como MARKDOWN SEGURO (react-markdown sin HTML crudo). Si no existe/inactiva/vacía → "no encontrada".
export default function MarketingLegalPage({ slug }: { slug: string }) {
  const { lang, toggleLang } = useMarketingLang();
  const { page, loading } = useMarketingLegalPage(slug);
  const es = lang === "es";
  const content = page ? (es ? page.contentEs : page.contentEn) : "";
  const available = page && page.isActive && content.trim().length > 0;
  return (
    <div className="rm-root min-h-screen bg-background">
      <header className="flex items-center justify-between px-6 py-5">
        <a href="/" className="font-display text-lg font-bold text-white">NÚCLEO<span className="text-primary">.</span></a>
        <button type="button" onClick={toggleLang} className="rounded-lg bg-secondary px-3 py-1.5 text-sm text-foreground">{es ? "EN" : "ES"}</button>
      </header>
      <main className="mx-auto min-h-[60vh] max-w-3xl px-6 py-12">
        <a href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-primary"><ArrowLeft size={16} /> {es ? "Volver al inicio" : "Back to home"}</a>
        {loading ? <p className="text-white/50">…</p> : available ? (
          <>
            <h1 className="mb-8 font-display text-3xl font-bold text-white md:text-4xl">{es ? page!.titleEs : page!.titleEn}</h1>
            <div className={PROSE}><ReactMarkdown>{content}</ReactMarkdown></div>
          </>
        ) : <p className="text-white/60">{es ? "Página no encontrada." : "Page not found."}</p>}
      </main>
      <MarketingFooter lang={lang} />
    </div>
  );
}
