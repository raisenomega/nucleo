import { ClockWidget } from "@hr/presentation/ClockWidget";
import { AttendanceHistory } from "@hr/presentation/AttendanceHistory";

// Asistencia del portal: marcar entrada/salida + mi historial del mes (reusa RRHH-5B, isStaff=false).
export function MyAttendance({ userId }: { userId: string }) {
  return (
    <div className="space-y-6">
      <ClockWidget userId={userId} />
      <AttendanceHistory userId={userId} isStaff={false} />
    </div>
  );
}
