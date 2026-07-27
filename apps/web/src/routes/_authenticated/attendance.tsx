import { createFileRoute } from "@tanstack/react-router";
import { AttendancePage } from "@hr/presentation/AttendancePage";

// Asistencia: visible a todo empleado (marca su entrada/salida). El staff ve al equipo + ajustes.
export const Route = createFileRoute("/_authenticated/attendance")({ component: AttendancePage });
