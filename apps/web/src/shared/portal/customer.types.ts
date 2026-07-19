// Portal del Cliente — perfil del customer (BC en shared/, sin alias, patrón shared/gps + shared/notifications).
export interface CustomerProfile {
  readonly id: string; readonly tenantId: string; readonly fullName: string; readonly email: string; readonly phone: string;
  readonly address: string; readonly city: string; readonly state: string; readonly zipCode: string; readonly photoUrl: string;
  readonly contactPreference: string; readonly language: string; readonly notesForTeam: string;
  readonly isActive: boolean; readonly notificationPref: string;
}
export type CustomerFormData = Omit<CustomerProfile, "id" | "tenantId" | "email" | "isActive" | "notificationPref">;
