import { escapeHtml } from "../src/shared/lib/escape-html";

// Correo de entrega del contrato firmado (v2a.5). Función pura: el handler decide SI se envía y a quién;
// aquí sólo se compone el asunto y el HTML, para poder probar la codificación de salida sin red ni Nitro.
// Codificación por contexto: todo valor no constante que cae en el cuerpo o en un atributo pasa por
// escapeHtml (signer_name lo teclea el firmante; las etiquetas pueden llegar en el body). El asunto es
// texto plano: no se escapa como HTML (saldría "&amp;" literal), sólo se le quitan los caracteres de
// control, CR/LF incluidos. Escapar `link` sólo impide salirse del href: NO valida de dónde sale la URL.
export interface ContractEmailInput {
  locale: "es" | "en";
  signerName: string;
  contractNumber: string;
  termsHash: string;
  link: string;
  labels: Record<string, string | undefined>;
}

const COPY = {
  en: { p: "Your signed agreement is attached. You can also view it online:", v: "View agreement" },
  es: { p: "Adjuntamos tu contrato firmado. También puedes verlo en línea:", v: "Ver contrato" },
} as const;

const plainText = (s: string) => s.replace(/\p{Cc}+/gu, " ").trim();

export function buildContractEmail(i: ContractEmailInput): { subject: string; html: string } {
  const t = COPY[i.locale];
  const html = `<p>${escapeHtml(i.signerName)},</p><p>${t.p}</p>`
    + `<p><a href="${escapeHtml(i.link)}">${t.v}</a></p>`
    + `<p style="color:#888;font-size:12px">${escapeHtml(i.labels.hash)}: ${escapeHtml(i.termsHash)}</p>`;
  return { subject: plainText(`${i.labels.number} ${i.contractNumber}`), html };
}
