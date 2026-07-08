import type { TranslationKey } from "./translations.keys";

// Diccionario suplementario (Documentos y contratos). Se fusiona en translations.ts.
export const esDocs = {
  documentsSubtitle: "Contratos, licencias, permisos y pólizas con vencimientos",
  docTitle: "Título del documento", newDocument: "Nuevo documento", parties: "Partes (coma)", tags: "Etiquetas (coma)",
  effectiveDate: "Fecha efectiva", expiringSoon: "documento(s) por vencer", renew: "Renovar", allTypes: "Todos los tipos",
  dcContract: "Contrato", dcAgreement: "Acuerdo", dcLicense: "Licencia", dcPermit: "Permiso", dcInsurance: "Seguro",
  dcPolicy: "Póliza", dcManual: "Manual", dcCertificate: "Certificado", dcLegal: "Legal", dcOther: "Otro",
  dsDraft: "Borrador", dsActive: "Activo", dsExpired: "Vencido", dsCancelled: "Cancelado",
} satisfies Partial<Record<TranslationKey, string>>;
