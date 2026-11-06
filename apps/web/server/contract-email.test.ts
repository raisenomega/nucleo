import { describe, expect, it } from "vitest";
import { buildContractEmail, type ContractEmailInput } from "./contract-email";

// signer_name lo teclea el firmante en la aceptación pública y las etiquetas pueden llegar en el body:
// ningún valor no constante debe poder abrir marcado en el correo ni salirse del atributo href.
const base: ContractEmailInput = {
  locale: "es", signerName: "José Muñoz", contractNumber: "CTR-0001", termsHash: "9f86d081884c7d65",
  link: "https://app.example.test/contrato/abc123", labels: { number: "Contrato", hash: "Huella del texto (SHA-256)" },
};

describe("buildContractEmail", () => {
  it("escapa signer_name en el cuerpo HTML", () => {
    const { html } = buildContractEmail({ ...base, signerName: `O'Brien & <Hijos> "SA"` });
    expect(html).toContain("O&#39;Brien &amp; &lt;Hijos&gt; &quot;SA&quot;");
    expect(html).not.toContain("<Hijos>");
  });

  it("con datos normales el HTML es el de siempre (no escapa de más: acentos y eñes intactos)", () => {
    expect(buildContractEmail(base).html).toBe(
      "<p>José Muñoz,</p><p>Adjuntamos tu contrato firmado. También puedes verlo en línea:</p>"
      + `<p><a href="https://app.example.test/contrato/abc123">Ver contrato</a></p>`
      + `<p style="color:#888;font-size:12px">Huella del texto (SHA-256): 9f86d081884c7d65</p>`);
    expect(buildContractEmail({ ...base, locale: "en" }).html).toContain(">View agreement</a>");
  });

  it("escapa etiqueta y hash, y el enlace no puede salirse del atributo href", () => {
    const { html } = buildContractEmail({ ...base, termsHash: "<i>h</i>", link: `https://x.test/"><b>x</b>`,
      labels: { ...base.labels, hash: "<img src=x onerror=alert(1)>" } });
    expect(html).not.toMatch(/<img|<i>|<b>/);
    expect(html).toContain(`href="https://x.test/&quot;&gt;&lt;b&gt;x&lt;/b&gt;"`);
  });

  it("asunto: texto plano, sin CR/LF y sin entidades HTML", () => {
    const { subject } = buildContractEmail({ ...base, labels: { ...base.labels, number: "O'Brien & Co\r\nBcc: x@evil.test" } });
    expect(subject).not.toMatch(/[\r\n]/);
    expect(subject).toBe("O'Brien & Co Bcc: x@evil.test CTR-0001");
  });
});
