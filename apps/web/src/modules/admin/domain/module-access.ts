// BC admin — matriz de accesos por modulo. Puro. Fuente de verdad de checkmarks + enforcement.
import type { AppRole } from "@admin/domain/admin.types";

// CRUD operativo + permisos granulares: cost (precios), salary (nomina), documents (leads),
// categories (crear categorias), bank/fiscal (datos de conciliacion).
export type Perm = "view" | "create" | "edit" | "delete" | "cost" | "salary" | "documents" | "categories" | "bank" | "fiscal";
export type ModuleAccess = Record<string, Partial<Record<Perm, boolean>>>;

const ALL: Perm[] = ["view", "create", "edit", "delete"];

export const ACCESS_MODULES: { key: string; label: string; crud: Perm[]; note: string }[] = [
  { key: "dashboard", label: "Dashboard", crud: ["view"], note: "" },
  { key: "routes", label: "Rutas", crud: ALL, note: "operaciones/servicio" },
  { key: "income", label: "Ingresos", crud: ALL, note: "" },
  { key: "expenses", label: "Gastos", crud: ALL, note: "" },
  { key: "payroll", label: "Nómina", crud: [...ALL, "salary"], note: "salary = salario/deducciones" },
  { key: "extraordinary", label: "Extraordinarios", crud: ALL, note: "" },
  { key: "inventory", label: "Inventario", crud: [...ALL, "cost"], note: "cost = precios/costo" },
  { key: "leads", label: "Leads", crud: [...ALL, "documents"], note: "documents = WhatsApp/cotizar/factura" },
  { key: "marketing", label: "Marketing", crud: ALL, note: "" },
  { key: "reconciliation", label: "Conciliación", crud: [...ALL, "bank", "fiscal"], note: "bank/fiscal = datos sensibles" },
  { key: "recurring", label: "Gastos recurrentes", crud: ALL, note: "" },
  { key: "accounts_receivable", label: "Cuentas por cobrar", crud: ["view", "edit"], note: "edit = cobrar/perdonar" },
  { key: "reports", label: "Reportes", crud: ["view"], note: "operaciones = solo su rendimiento" },
  { key: "evaluations", label: "Evaluaciones", crud: ALL, note: "desempeño (ceo/coo)" },
  { key: "observations", label: "Observaciones", crud: ALL, note: "coaching (ceo/coo)" },
  { key: "settings", label: "Configuración", crud: ["view", "edit", "categories"], note: "categories = crear categorías" },
];

const V = { view: true };
const perms = (crud: Perm[]) => Object.fromEntries(crud.map((p) => [p, true]));
const everything = () => Object.fromEntries(ACCESS_MODULES.map((m) => [m.key, perms(m.crud)])) as ModuleAccess;

// Defaults por rol (§3 del doc). ceo/superadmin todo; coo todo salvo settings.edit; oper/servicio minimo.
export const ROLE_DEFAULTS: Record<AppRole, ModuleAccess> = {
  superadmin: everything(),
  ceo: everything(),
  coo: { ...everything(), settings: { view: true, categories: true } },
  operaciones: { dashboard: V, expenses: { view: true, create: true }, inventory: { view: true, edit: true },
    accounts_receivable: { view: true }, reports: { view: true }, evaluations: { view: true, create: true },
    routes: { view: true, create: true, edit: true, delete: true } },
  servicio: { dashboard: V, inventory: V, evaluations: { view: true, create: true },
    routes: { view: true, create: true, edit: true } },
};

export function defaultsFor(role: AppRole | null): ModuleAccess {
  return role ? ROLE_DEFAULTS[role] : {};
}
