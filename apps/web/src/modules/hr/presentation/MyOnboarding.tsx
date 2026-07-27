import { OnboardingDetail } from "@hr/presentation/OnboardingDetail";

// Onboarding del portal: el empleado completa sus tareas (firma/docs); las del admin son read-only (reusa RRHH-4).
export function MyOnboarding({ userId, tenantId }: { userId: string; tenantId: string }) {
  return <OnboardingDetail employeeId={userId} employeeName="" isStaff={false} tenantId={tenantId} />;
}
