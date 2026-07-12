import type { ReservableService } from "@agenda/domain/reservable-service.types";

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

// Extrae UUIDs de service_requested del lead y busca un service del catálogo que matchee. null si no matchea.
export const parseServiceUuids = (text: string): string[] => text.match(UUID) ?? [];
export function findMatchingService(text: string, services: ReservableService[]): ReservableService | null {
  const ids = parseServiceUuids(text);
  return services.find((s) => ids.includes(s.id)) ?? null;
}
