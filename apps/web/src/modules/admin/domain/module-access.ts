// BC admin — matriz de accesos por modulo. Puro. Fuente de verdad de checkmarks + enforcement futuro.
import type { AppRole } from "@admin/domain/admin.types";

export type Perm = "view" | "create" | "edit" | "delete";
export type ModuleAccess = Record<string, Partial<Record<Perm, boolean>>>;

const ALL: Perm[] = ["view", "create", "edit", "delete"];

export const ACCESS_MODULES: { key: string; label: string; crud: Perm[]; note: string }[] = [
  { key: "dashboard", label: "Dashboard", crud: ["view"], note: "" },
  { key: "income", label: "Ingresos", crud: ALL, note: "" },
  { key: "expenses", label: "Gastos", crud: ALL, note: "" },
  { key: "payroll", label: "Nómina", crud: ALL, note: "Solo CEO/COO" },
  { key: "extraordinary", label: "Extraordinarios", crud: ALL, note: "" },
  { key: "inventory", label: "Inventario", crud: ALL, note: "Sin precios (oper.)" },
  { key: "leads", label: "Leads", crud: ALL, note: "" },
  { key: "marketing", label: "Marketing", crud: ALL, note: "Solo KPIs" },
  { key: "reconciliation", label: "Conciliación", crud: ALL, note: "Solo CEO/COO" },
  { key: "recurring", label: "Gastos recurrentes", crud: ALL, note: "" },
  { key: "settings", label: "Configuración", crud: ALL, note: "Solo CEO" },
];

const V = { view: true };
const FULL = { view: true, create: true, edit: true, delete: true };
const everything = () => Object.fromEntries(ACCESS_MODULES.map((m) => [m.key, FULL])) as ModuleAccess;

// Defaults por rol (§3 del doc). Solo se listan modulos con algun permiso.
export const ROLE_DEFAULTS: Record<AppRole, ModuleAccess> = {
  superadmin: everything(),
  ceo: everything(),
  coo: { ...everything(), settings: V },
  operaciones: { dashboard: V, expenses: { view: true, create: true }, inventory: { view: true, edit: true } },
  servicio: { dashboard: V, inventory: V },
};

export function defaultsFor(role: AppRole | null): ModuleAccess {
  return role ? ROLE_DEFAULTS[role] : {};
}
