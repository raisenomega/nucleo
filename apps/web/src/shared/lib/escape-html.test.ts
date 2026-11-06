import { describe, expect, it } from "vitest";
import { escapeHtml } from "./escape-html";

describe("escapeHtml", () => {
  it("codifica los cinco caracteres con significado en HTML", () => {
    expect(escapeHtml(`& < > " '`)).toBe("&amp; &lt; &gt; &quot; &#39;");
  });

  it("hace una sola pasada: una entidad ya escrita se escapa, no se interpreta", () => {
    expect(escapeHtml("&lt;")).toBe("&amp;lt;");
  });

  it("null/undefined → cadena vacía; el resto pasa por String()", () => {
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
    expect(escapeHtml(0)).toBe("0");
  });

  it("no toca texto sin esos caracteres (acentos, eñes)", () => {
    expect(escapeHtml("José Muñoz")).toBe("José Muñoz");
  });
});
