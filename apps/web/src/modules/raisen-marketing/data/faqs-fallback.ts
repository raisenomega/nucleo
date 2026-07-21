import type { FaqRow, FaqConfig } from "@raisen-marketing/data/faq.types";

// Fallback de la sección FAQ (subconjunto del seed de la migr 215). Se usa mientras la DB responde o si
// Supabase falla, para que la sección nunca quede vacía. Solo las 4 preguntas más importantes: el fallback
// es una red de seguridad, no una copia que haya que mantener sincronizada entera.
export const FAQ_CONFIG_FALLBACK: FaqConfig = {
  id: "", eyebrowEs: "Preguntas frecuentes", eyebrowEn: "FAQ",
  titleEs: "Lo que más nos preguntan", titleEn: "Frequently asked questions",
};

const f = (id: string, qEs: string, qEn: string, aEs: string, aEn: string, o: number): FaqRow =>
  ({ id, questionEs: qEs, questionEn: qEn, answerEs: aEs, answerEn: aEn, isActive: true, displayOrder: o });

export const FAQS_FALLBACK: FaqRow[] = [
  f("q1", "¿Qué es NÚCLEO?", "What is NÚCLEO?",
    "NÚCLEO es una plataforma de gestión operacional para PYMEs y empresas grandes. Integra facturación, operaciones, nómina, fiscal, landing white-label y agentes IA en un solo sistema bajo la marca del cliente.",
    "NÚCLEO is an operational management platform for SMBs and large companies. It integrates billing, operations, payroll, tax compliance, white-label landing pages and AI agents in a single system under the client's brand.", 1),
  f("q2", "¿Para qué tipo de empresa es NÚCLEO?", "What type of business is NÚCLEO for?",
    "Para cualquier empresa que necesite estructura departamental y gestión integrada — desde PYMEs hasta empresas grandes, en cualquier industria y nicho.",
    "For any business that needs departmental structure and integrated management — from SMBs to large companies, in any industry and niche.", 2),
  f("q3", "¿Puedo usar NÚCLEO con mi propia marca?", "Can I use NÚCLEO with my own brand?",
    "Sí. NÚCLEO es 100% white-label. Tu cliente ve tu marca, tu dominio, tu logo — nunca la marca de NÚCLEO.",
    "Yes. NÚCLEO is 100% white-label. Your client sees your brand, your domain, your logo — never the NÚCLEO brand.", 3),
  f("q4", "¿Hay límite de usuarios?", "Is there a user limit?",
    "No. Todos los planes incluyen usuarios ilimitados. No cobramos por persona que acceda al sistema.",
    "No. All plans include unlimited users. We don't charge per person accessing the system.", 4),
];
