// BC finance — tipos de dominio del dashboard. Puro: sin imports externos.
export interface RecentItem {
  readonly date: string;
  readonly category: string | null;
  readonly amount: number;
}

export interface Snapshot {
  readonly totalIncome: number;
  readonly totalExpenses: number;
  readonly balance: number;
  readonly incomeCount: number;
  readonly expenseCount: number;
  readonly topIncomeCategory: string | null;
  readonly topExpenseCategory: string | null;
  readonly recentIncome: readonly RecentItem[];
  readonly recentExpenses: readonly RecentItem[];
}

export interface RecentLead {
  readonly contactName: string;
  readonly phone: string;
  readonly temperature: string;
  readonly status: string;
  readonly quotedPrice: number;
  readonly callDate: string;
}

export interface CrmSnapshot {
  readonly totalLeads: number;
  readonly totalQuoted: number;
  readonly conversionRate: number;
  readonly byTemperature: { readonly hot: number; readonly warm: number; readonly cold: number };
  readonly byStatus: Readonly<Record<string, number>>;
  readonly recentLeads: readonly RecentLead[];
}

export interface MktSnapshot {
  readonly executedPct: number;
  readonly totalBudget: number;
  readonly totalSpent: number;
}

export interface FiscalSnapshot {
  readonly availableBalance: number;
  readonly operatingStatus: "surplus" | "tight" | "deficit";
  readonly breakEvenPct: number;
  readonly shortfall: number;
  readonly surplus: number;
  readonly bankCalculated: number;
  readonly payrollCost: number;
  readonly recurringBudgeted: number;
  readonly recurringPaid: number;
  readonly operatingProfit: number;
}

// DASH-1: bandas nuevas del centro de comando.
export interface Aging { readonly current: number; readonly b1_30: number; readonly b31_60: number; readonly b61_90: number; readonly b90_plus: number; readonly total: number }
export interface InvSnapshot { readonly totalItems: number; readonly totalValue: number; readonly lowStock: number; readonly expiringLots: number; readonly cogsMonth: number; readonly topConsumed: readonly { readonly name: string; readonly qty: number }[] }
export interface OpsSnapshot { readonly routesTotal: number; readonly routesDone: number; readonly stopsTotal: number; readonly stopsDone: number; readonly fleetInService: number; readonly geofenceEvents: number; readonly maintAlerts: number; readonly customersActive: number; readonly customersNew: number; readonly customersDebt: number }
export interface TrendPoint { readonly month: number; readonly income: number; readonly expenses: number; readonly profit: number }

// Puerto del repositorio — lo implementa infrastructure; lo consume application (DI).
export interface IDashboardRepository {
  getSnapshot(month?: Date): Promise<Snapshot | null>;
  getCrmSnapshot(month?: Date): Promise<CrmSnapshot | null>;
  getMarketingSnapshot(month?: Date): Promise<MktSnapshot | null>;
  getReconciliationSnapshot(month?: Date): Promise<FiscalSnapshot | null>;
  getArAging(): Promise<Aging | null>;
  getApAging(): Promise<Aging | null>;
  getInventory(): Promise<InvSnapshot | null>;
  getOps(): Promise<OpsSnapshot | null>;
  getTrend(): Promise<readonly TrendPoint[]>;
}
