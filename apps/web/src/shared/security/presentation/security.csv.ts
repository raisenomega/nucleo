import type { AuditEntry } from "@shared/security/domain/security.types";

// Exporta el audit log actual a CSV (solo superadmin llega aquí). Descarga vía blob.
export function downloadAuditCsv(rows: AuditEntry[]): void {
  const head = ["fecha", "tenant", "usuario", "accion", "entidad", "riesgo"];
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = rows.map((a) =>
    [a.createdAt, a.tenantName ?? "", a.userName ?? "", a.action, a.entityType ?? "", a.riskLevel].map((c) => esc(String(c))).join(","),
  );
  const csv = [head.join(","), ...lines].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "audit-log.csv";
  link.click();
  URL.revokeObjectURL(url);
}
