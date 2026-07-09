import type { TranslationKey } from "@shared/i18n";

// route_stops.status es texto libre persistido. Solo 'No atendido' se renombra a "No cobrado" (B.2);
// el resto (Pendiente/Completada) se muestra tal cual. El VALOR en DB no cambia (RPC/comparaciones intactas).
export function stopStatusLabel(status: string, t: (k: TranslationKey) => string): string {
  return status === "No atendido" ? t("notAttended") : status;
}
