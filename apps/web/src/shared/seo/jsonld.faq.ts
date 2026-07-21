import { PRICE_PRO, PRICE_ENTERPRISE } from "@shared/seo/site.constants";

const qa = (q: string, a: string) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } });

// JSON-LD FAQPage — genera rich snippets en Google y es la fuente que mejor citan los motores de respuesta
// (ChatGPT, Perplexity, Gemini): preguntas y respuestas literales, sin marcas competidoras.
export const FAQ_LD = {
  "@context": "https://schema.org", "@type": "FAQPage",
  mainEntity: [
    qa("¿Qué es NÚCLEO?",
      "NÚCLEO es una plataforma de gestión operacional para PYMEs y empresas grandes. Integra facturación, " +
      "operaciones, nómina, fiscal, landing white-label y agentes IA en un solo sistema bajo la marca del cliente. " +
      "Se adapta a cualquier industria en Puerto Rico y Latinoamérica."),
    qa("¿Para qué tipo de empresa es NÚCLEO?",
      "Para cualquier empresa que necesite estructura departamental y gestión integrada — desde PYMEs hasta " +
      "empresas grandes, en cualquier industria y nicho. NÚCLEO simplifica sistemas de gestión empresarial " +
      "complejos en soluciones accesibles y escalables."),
    qa("¿Cuánto cuesta NÚCLEO?",
      `NÚCLEO tiene 2 planes: Pro desde $${PRICE_PRO}/mes y Enterprise con pago único de $${PRICE_ENTERPRISE}. ` +
      "Ambos incluyen la plataforma completa con gestión departamental."),
    qa("¿NÚCLEO cumple con la regulación fiscal de Puerto Rico?",
      "Sí. NÚCLEO incluye un motor de contribución con reglas versionadas, alertas de informativas y estrategias " +
      "de optimización fiscal adaptadas a Puerto Rico."),
    qa("¿Puedo usar NÚCLEO con mi propia marca?",
      "Sí. NÚCLEO es 100% white-label. Tu cliente ve tu marca, tu dominio, tu logo — no la marca de NÚCLEO."),
    qa("¿Qué módulos incluye NÚCLEO?",
      "Facturación inteligente, rutas y operaciones de campo, nómina y talento, cumplimiento fiscal PR, landing " +
      "white-label con APP nativa, agentes IA, reportes, gestión documental y auto-contabilidad."),
  ],
};
