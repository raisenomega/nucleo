// BC operations — dominio de rutas de servicio (service_routes + route_stops). Puro.
export type RepoResult = { ok: true } | { ok: false; error: string };

export interface ServiceRoute {
  readonly id: string; readonly routeDate: string; readonly assignedTo: string;
  readonly status: string; readonly notes: string | null;
  readonly createdBy: string; readonly stopCount: number; readonly completedCount: number;
}
export interface RouteStop {
  readonly id: string; readonly routeId: string; readonly stopOrder: number;
  readonly clientName: string; readonly address: string; readonly city: string | null;
  readonly serviceType: string; readonly scheduledTime: string; readonly phone: string | null;
  readonly estimatedAmount: number; readonly actualAmount: number | null;
  readonly paymentMethodId: string | null; readonly status: string;
  readonly notes: string | null; readonly completedAt: string | null;
  readonly evidenceUrls: string[]; readonly amountReceived: number | null;
  readonly changeAmount: number | null; readonly pendingCollection: boolean;
}
export interface RouteFormData { routeDate: string; assignedTo: string; status: string; notes: string; }
export interface StopFormData {
  clientName: string; address: string; city: string; serviceType: string;
  scheduledTime: string; estimatedAmount: number; notes: string; phone: string;
}
export interface CompletePayload { amount: number; paymentMethodId: string; received: number | null; change: number | null; evidence: string[]; }
export type EditableStop = StopFormData & { id?: string };
export type StopPatch = Partial<StopFormData> & { status?: string; completedAt?: string | null; stopOrder?: number; evidenceUrls?: string[] };
export interface StopSupply { readonly itemId: string; readonly name: string; readonly quantity: number; }
export interface SupplyUse { itemId: string; quantity: number; }

export interface IRouteRepository {
  completeStop(stopId: string, p: CompletePayload): Promise<RepoResult>;
  setNotAttended(stopId: string, reason: string): Promise<RepoResult>;
  listRoutes(date: string): Promise<readonly ServiceRoute[]>;
  listStops(routeId: string): Promise<readonly RouteStop[]>;
  create(d: RouteFormData, stops: readonly StopFormData[]): Promise<RepoResult>;
  update(id: string, d: RouteFormData): Promise<RepoResult>;
  remove(id: string): Promise<RepoResult>;
  addStop(routeId: string, order: number, s: StopFormData): Promise<RepoResult>;
  updateStop(id: string, patch: StopPatch): Promise<RepoResult>;
  removeStop(id: string): Promise<RepoResult>;
  reorderStops(orderedIds: readonly string[]): Promise<RepoResult>;
  recordSupplies(stopId: string, items: SupplyUse[]): Promise<RepoResult>;
  listSupplies(stopId: string): Promise<readonly StopSupply[]>;
}
