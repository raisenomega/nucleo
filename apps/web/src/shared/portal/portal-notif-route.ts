// Mapea el entity_type de una notificación a la ruta del PORTAL (no la del admin).
export function portalNotifRoute(entityType: string): string {
  switch (entityType) {
    case "ticket": return "/portal/support";
    case "order": return "/portal/orders";
    case "appointment": return "/portal/appointments";
    default: return "/portal";
  }
}
