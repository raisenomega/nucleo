import { createFileRoute, Navigate } from "@tanstack/react-router";

// /accounting bare → redirige al plan de cuentas.
export const Route = createFileRoute("/_authenticated/accounting/")({ component: () => <Navigate to="/accounting/chart" /> });
