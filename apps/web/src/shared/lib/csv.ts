// Parser CSV mínimo sin dependencias: detecta separador (, ; \t), respeta comillas dobles y escapes "".
export interface ParsedCsv { headers: string[]; rows: string[][] }

function detectDelim(line: string): string {
  const counts: Record<string, number> = { ",": 0, ";": 0, "\t": 0 };
  let q = false;
  for (const ch of line) { if (ch === '"') q = !q; else if (!q && ch in counts) counts[ch] = (counts[ch] ?? 0) + 1; }
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return best && best[1] > 0 ? best[0] : ",";
}

function splitLine(line: string, delim: string): string[] {
  const out: string[] = []; let cur = ""; let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
    else if (ch === delim && !q) { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out.map((c) => c.trim());
}

export function parseCsv(text: string): ParsedCsv {
  const clean = text.replace(/\r\n?/g, "\n").replace(/^﻿/, "").trim();
  const lines = clean.split("\n").filter((l) => l.trim() !== "");
  if (!lines.length) return { headers: [], rows: [] };
  const delim = detectDelim(lines[0] ?? "");
  const all = lines.map((l) => splitLine(l, delim));
  return { headers: all[0] ?? [], rows: all.slice(1) };
}
