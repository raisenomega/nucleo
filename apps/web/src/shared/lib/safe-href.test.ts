import { describe, expect, it } from "vitest";
import { safeHref } from "./safe-href";

describe("safeHref", () => {
  it.each([
    "#form",
    "/precios",
    "?ref=x",
    "precios",
    "https://ej.com/a",
    "http://ej.com",
    "HTTPS://ej.com",
    "mailto:a@b.co",
    "tel:+34600000000",
    "sms:+34600000000",
    "whatsapp://send?phone=34600000000",
  ])("acepta %s", (u) => expect(safeHref(u)).toBe(u));

  it.each([
    "javascript:alert(1)",
    "JavaScript:alert(1)",
    " javascript:alert(1)",
    "java\tscript:alert(1)",
    "java\nscript:alert(1)",
    "\u0001javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "file:///etc/passwd",
  ])("bloquea %j", (u) => expect(safeHref(u)).toBe("#"));

  it("vacío o nulo → fallback", () => {
    expect(safeHref("")).toBe("#");
    expect(safeHref(undefined)).toBe("#");
    expect(safeHref("javascript:x", "/")).toBe("/");
  });
});
