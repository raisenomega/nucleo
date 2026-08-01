import { defineHandler } from "h3";
import { createElement as h } from "react";

// SMOKE TEST de v2a.5 — TEMPORAL, se retira en cuanto quede verificado.
// Responde la única pregunta que no se puede contestar en local: ¿Vercel ejecuta los handlers Nitro en
// runtime Node (donde @react-pdf/renderer puede renderizar a buffer sin navegador) o en Edge (donde no)?
// Toda la arquitectura de contratos —PDF adjunto al email de aceptación— depende de la respuesta.
// Sin auth a propósito: no lee ni escribe nada, sólo demuestra que el runtime sirve.
export default defineHandler(async () => {
  const { renderToBuffer, Document, Page, Text, View, StyleSheet } = await import("@react-pdf/renderer");
  const s = StyleSheet.create({ page: { padding: 48, fontSize: 12 }, h: { fontSize: 20, marginBottom: 16 } });
  const doc = h(Document, null,
    h(Page, { size: "LETTER", style: s.page },
      h(View, null,
        h(Text, { style: s.h }, "Smoke test v2a.5"),
        h(Text, null, `runtime: ${typeof process !== "undefined" ? `node ${process.version}` : "desconocido"}`),
        h(Text, null, `generado: ${new Date().toISOString()}`))));
  const buf = await renderToBuffer(doc as never);
  return new Response(buf as unknown as BodyInit, {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": 'inline; filename="smoke-test-v2a5.pdf"',
      "cache-control": "no-store",
    },
  });
});
