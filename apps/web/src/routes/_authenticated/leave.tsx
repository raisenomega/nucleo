import { createFileRoute } from "@tanstack/react-router";
import { LeavePage } from "@hr/presentation/LeavePage";

// Vacaciones/ausencias: el empleado solicita; el staff aprueba/rechaza y ve el calendario del equipo.
export const Route = createFileRoute("/_authenticated/leave")({ component: LeavePage });
