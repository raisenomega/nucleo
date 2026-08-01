import { defineHandler, getRequestHeader, getRequestHost, readBody } from "h3";
import { createElement as h } from "react";

// v2a.5 · POST /api/contract-pdf — renderiza el PDF del contrato firmado, lo archiva y avisa por email.
// LA INFRA QUEDA DORMIDA: nadie lo llama todavía (v2a.6 lo enciende desde el flujo de aceptación).
// Vive en Nitro y no en el navegador por dos razones que no son de comodidad: (1) el PDF es EVIDENCIA y
// debe generarse desde el snapshot que ya está en la BD, no desde el DOM del firmante, que es manipulable;
// (2) el email con adjunto necesita salir aunque el firmante cierre la pestaña al segundo de aceptar.
// Runtime verificado en prod (smoke test contract-pdf-test-handler): Node v24, renderToBuffer → 200.
//
// FAIL-CLOSED POR DISEÑO: cada paso que hoy NO tiene credenciales en Vercel devuelve 503 'not_configured'
// con la lista exacta de variables que faltan, en vez de fingir éxito. Es preferible un 503 honesto a un
// { success: true } que no archivó ni envió nada — este endpoint acabará siendo la única prueba de que un
// contrato se entregó, y un falso positivo aquí es peor que una caída.

const SUPA_URL = () => process.env.VITE_SUPABASE_URL || "";
const ANON = () => process.env.VITE_SUPABASE_ANON_KEY || "";
// Sólo VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY existen hoy del lado Nitro (las usa manifest-handler en
// prod). Service-role y Resend NO están dados de alta: la key de Resend vive en el Vault de Postgres, que
// es inalcanzable desde aquí sin service-role. Ver el resumen de la rodaja para el alta en Vercel.
const SERVICE = () => process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const RESEND = () => process.env.RESEND_API_KEY || "";
const MAIL_FROM = () => process.env.CONTRACT_EMAIL_FROM || "";

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), {
  status, headers: { "content-type": "application/json", "cache-control": "no-store" },
});
// Comparación en tiempo constante: el secreto se compara byte a byte sin cortocircuitar para no filtrar
// su prefijo por diferencia de latencia (el endpoint es público en Internet aunque nadie lo use aún).
function safeEq(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0; for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Etiquetas por defecto. El PDF NO lleva contexto de i18n dentro (regla de @react-pdf/renderer en este
// repo), así que el texto entra por props; el llamador puede sobreescribirlas con body.labels.
const LABELS: Record<string, Record<string, string>> = {
  es: { title: "Contrato de servicio", number: "Contrato", signedAt: "Firmado el", signer: "Firmante",
        email: "Correo", ip: "IP de origen", hash: "Huella del texto (SHA-256)", summary: "Resumen",
        terms: "Términos y condiciones", evidence: "Evidencia de aceptación" },
  en: { title: "Service agreement", number: "Contract", signedAt: "Signed on", signer: "Signer",
        email: "Email", ip: "Source IP", hash: "Text fingerprint (SHA-256)", summary: "Summary",
        terms: "Terms and conditions", evidence: "Acceptance evidence" },
};

interface Contract { contract_number: string; signed_at: string; signer_name: string; signer_email: string;
  locale: string; terms: string; terms_summary: string | null; terms_hash: string; ip_address: string | null;
  tenant_name: string; primary_color: string | null; accent_color: string | null; logo_url: string | null; }

// Lectura por token: get_public_contract es SECURITY DEFINER con grant a anon, así que NO hace falta
// service-role para leer. Es la única vía disponible hoy y es deliberada, no un parche.
async function readByToken(token: string) {
  const res = await fetch(`${SUPA_URL()}/rest/v1/rpc/get_public_contract`, {
    method: "POST", headers: { apikey: ANON(), authorization: `Bearer ${ANON()}`, "content-type": "application/json" },
    body: JSON.stringify({ p_token: token }),
  });
  return await res.json() as (Contract & { error?: string }) | null;
}

// Lectura por id: la tabla está bajo RLS por current_tenant(), y Nitro no tiene sesión de usuario → sólo
// funciona con service-role. Devuelve además tenant_id/id, que get_public_contract NO expone a propósito.
async function readById(id: string) {
  const sel = "id,tenant_id,contract_number,signed_at,signer_name,signer_email,locale,terms_snapshot,terms_summary_snapshot,terms_hash,ip_address";
  const q = `${SUPA_URL()}/rest/v1/tenant_signed_contracts?id=eq.${encodeURIComponent(id)}&select=${sel}&limit=1`;
  const rows = await (await fetch(q, { headers: { apikey: SERVICE(), authorization: `Bearer ${SERVICE()}` } })).json() as Record<string, string>[];
  const r = rows?.[0]; if (!r) return null;
  const th = await (await fetch(`${SUPA_URL()}/rest/v1/tenant_themes?tenant_id=eq.${r.tenant_id}&select=primary_color,accent_color,logo_url&limit=1`,
    { headers: { apikey: SERVICE(), authorization: `Bearer ${SERVICE()}` } })).json() as Record<string, string>[];
  const t = await (await fetch(`${SUPA_URL()}/rest/v1/tenants?id=eq.${r.tenant_id}&select=display_name,legal_name&limit=1`,
    { headers: { apikey: SERVICE(), authorization: `Bearer ${SERVICE()}` } })).json() as Record<string, string>[];
  return { contract: { contract_number: r.contract_number, signed_at: r.signed_at, signer_name: r.signer_name,
    signer_email: r.signer_email, locale: r.locale, terms: r.terms_snapshot, terms_summary: r.terms_summary_snapshot,
    terms_hash: r.terms_hash, ip_address: r.ip_address, tenant_name: t?.[0]?.display_name || t?.[0]?.legal_name || "",
    primary_color: th?.[0]?.primary_color || null, accent_color: th?.[0]?.accent_color || null,
    logo_url: th?.[0]?.logo_url || null } as Contract, tenantId: r.tenant_id, contractId: r.id };
}

export default defineHandler(async (event) => {
  const secret = process.env.CONTRACT_PDF_SECRET || "";
  // Sin secreto configurado NO se abre el endpoint: 503, nunca "pasa porque no hay nada que comparar".
  if (!secret) return json(503, { error: "not_configured", missing: ["CONTRACT_PDF_SECRET"], hint: "endpoint deshabilitado hasta darla de alta en Vercel" });
  if (!safeEq(getRequestHeader(event, "x-contract-secret") || "", secret)) return json(401, { error: "unauthorized" });
  if ((event.req.method || "").toUpperCase() !== "POST") return json(405, { error: "method_not_allowed" });
  if (!SUPA_URL() || !ANON()) return json(503, { error: "not_configured", missing: ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"] });

  const body = (await readBody<{ contract_id?: string; token?: string; base_url?: string; return_pdf?: boolean;
    labels?: Record<string, string> }>(event)) || {};
  const { contract_id: contractIdIn, token } = body;
  if (!token && !contractIdIn) return json(400, { error: "bad_request", hint: "se requiere { token } o { contract_id }" });

  // --- 1) Leer el contrato ------------------------------------------------------------------------
  let data: Contract | null = null, tenantId: string | null = null, contractId: string | null = contractIdIn || null;
  if (token) {
    const d = await readByToken(token);
    if (!d || d.error === "not_found") return json(404, { error: "not_found" });
    if (d.error === "rate_limited") return json(429, { error: "rate_limited" });
    data = d; // OJO: la vía anon no devuelve tenant_id ni contract_id → sin ellos no hay ruta de Storage.
  } else {
    if (!SERVICE()) return json(503, { error: "not_configured", missing: ["SUPABASE_SERVICE_ROLE_KEY"], hint: "leer por contract_id exige service-role (RLS por current_tenant); usa { token } mientras tanto" });
    const r = await readById(contractIdIn as string);
    if (!r) return json(404, { error: "not_found" });
    data = r.contract; tenantId = r.tenantId; contractId = r.contractId;
  }

  // --- 2) Renderizar ------------------------------------------------------------------------------
  const locale = data.locale === "en" ? "en" : "es";
  const labels = { ...LABELS[locale], ...(body.labels || {}) };
  let buf: Uint8Array;
  try {
    const { renderToBuffer } = await import("@react-pdf/renderer");
    // ContractPdf lo escribe otra rodaja en paralelo: se acepta export nombrado O default para no acoplar
    // el build a un detalle de estilo. Ruta relativa (no @shared) porque el bundle de Nitro no depende de
    // los alias de vite.config para resolver este import.
    const mod = await import("../src/shared/pdf/ContractPdf") as Record<string, unknown>;
    const ContractPdf = (mod.ContractPdf || mod.default) as never;
    if (!ContractPdf) return json(500, { error: "pdf_component_missing" });
    buf = await renderToBuffer(h(ContractPdf, { ...data, locale, labels }) as never);
  } catch (e) {
    return json(500, { error: "render_failed", detail: (e as Error)?.message?.slice(0, 300) });
  }
  const b64 = Buffer.from(buf).toString("base64");
  const filename = `${data.contract_number}.pdf`;
  const pending: string[] = [];

  // --- 3) Archivar en Storage ---------------------------------------------------------------------
  // Bucket privado 'tenant-documents' (migr 20260729000102). Subir exige service-role: su policy de RLS
  // pide foldername[1] = current_tenant(), y Nitro no tiene sesión. NOTA para v2a.6: la ruta pedida
  // ('contracts/{tenant_id}/…') NO satisface esa policy — sólo se leerá con service-role o URL firmada;
  // si se quiere lectura directa desde el panel, la ruta tendría que ser '{tenant_id}/contracts/…'.
  let pdfPath: string | null = null;
  if (!SERVICE() || !tenantId || !contractId) {
    pending.push(!SERVICE() ? "storage_upload:falta SUPABASE_SERVICE_ROLE_KEY" : "storage_upload:la lectura por token no expone tenant_id/contract_id");
  } else {
    const path = `contracts/${tenantId}/${contractId}.pdf`;
    const up = await fetch(`${SUPA_URL()}/storage/v1/object/tenant-documents/${path}`, {
      method: "POST", headers: { authorization: `Bearer ${SERVICE()}`, "content-type": "application/pdf", "x-upsert": "true" },
      body: buf as unknown as BodyInit,
    });
    if (!up.ok) return json(502, { error: "storage_failed", status: up.status, detail: (await up.text()).slice(0, 300) });
    // pdf_path se persiste en la fila para que el panel no tenga que reconstruir la convención de ruta.
    await fetch(`${SUPA_URL()}/rest/v1/tenant_signed_contracts?id=eq.${contractId}`, {
      method: "PATCH", headers: { apikey: SERVICE(), authorization: `Bearer ${SERVICE()}`, "content-type": "application/json", prefer: "return=minimal" },
      body: JSON.stringify({ pdf_path: path }),
    });
    pdfPath = path;
  }

  // --- 4) Email con adjunto + enlace --------------------------------------------------------------
  // Resend vive hoy SÓLO en el Vault de Postgres (lo usan los triggers SQL con la extensión http), no en
  // el entorno de Vercel → sin RESEND_API_KEY aquí no se envía nada y se declara como pendiente.
  let emailed = false;
  const host = getRequestHost(event) || "";
  const base = (body.base_url || (host ? `https://${host}` : "")).replace(/\/$/, "");
  const link = token && base ? `${base}/contrato/${token}` : null;
  if (!RESEND() || !MAIL_FROM()) {
    pending.push(`email:faltan ${[!RESEND() && "RESEND_API_KEY", !MAIL_FROM() && "CONTRACT_EMAIL_FROM"].filter(Boolean).join(" + ")}`);
  } else if (!link) {
    pending.push("email:sin token en claro no hay enlace público (/contrato/{token}) y el email pierde su función");
  } else {
    const t = locale === "en"
      ? { s: `${labels.number} ${data.contract_number}`, p: "Your signed agreement is attached. You can also view it online:", v: "View agreement" }
      : { s: `${labels.number} ${data.contract_number}`, p: "Adjuntamos tu contrato firmado. También puedes verlo en línea:", v: "Ver contrato" };
    const html = `<p>${data.signer_name},</p><p>${t.p}</p><p><a href="${link}">${t.v}</a></p>`
      + `<p style="color:#888;font-size:12px">${labels.hash}: ${data.terms_hash}</p>`;
    const send = await fetch("https://api.resend.com/emails", {
      method: "POST", headers: { authorization: `Bearer ${RESEND()}`, "content-type": "application/json" },
      body: JSON.stringify({ from: `${data.tenant_name} <${MAIL_FROM()}>`, to: data.signer_email, subject: t.s,
        html, attachments: [{ filename, content: b64 }] }),
    });
    if (!send.ok) return json(502, { error: "email_failed", status: send.status, detail: (await send.text()).slice(0, 300) });
    emailed = true;
  }

  // success = el PDF existe. `pending` dice qué NO se hizo y por qué: sin él, un 200 aquí mentiría.
  return json(200, { success: true, pdf_path: pdfPath, stored: pdfPath !== null, emailed, bytes: buf.length,
    contract_number: data.contract_number, pending, ...(body.return_pdf ? { pdf_base64: b64 } : {}) });
});
