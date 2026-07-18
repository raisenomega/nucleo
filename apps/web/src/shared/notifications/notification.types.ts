// Notificación in-app (tabla notifications). read_at null = no leída. Navegación por entity_type/entity_id.
export interface AppNotification {
  readonly id: string; readonly kind: string; readonly title: string; readonly body: string;
  readonly entityType: string; readonly entityId: string | null;
  readonly readAt: string | null; readonly createdAt: string;
}

export type NotifFilter = "all" | "unread" | "order" | "lead" | "appointment" | "system";
