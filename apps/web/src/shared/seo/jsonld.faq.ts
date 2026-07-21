import { PRICE_STARTER, PRICE_PRO, PRICE_ENTERPRISE, PRICE_SETUP, PRICE_APP_NATIVE, PRICE_AGENT_FROM } from "@shared/seo/site.constants";

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
      `NÚCLEO tiene 3 planes: Starter desde $${PRICE_STARTER}/mes, Pro desde $${PRICE_PRO}/mes, y Enterprise ` +
      `desde $${PRICE_ENTERPRISE}/mes. Todos incluyen usuarios ilimitados y un setup de implementación de $${PRICE_SETUP}.`),
    qa("¿Qué complementos puedo añadir a NÚCLEO?",
      `App nativa white-label para iOS y Android por $${PRICE_APP_NATIVE} (pago único), y agentes IA verticales ` +
      `desde $${PRICE_AGENT_FROM}/mes: fiscal y contable, ventas, soporte y recursos humanos.`),
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
