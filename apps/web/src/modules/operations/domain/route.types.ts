// BC operations — dominio de rutas de servicio (service_routes + route_stops). Puro.
export type RepoResult = { ok: true } | { ok: false; error: string };

export interface ServiceRoute {
  readonly id: string; readonly routeDate: string; readonly assignedTo: string;
  readonly status: string; readonly notes: string | null;
  readonly createdBy: string; readonly stopCount: number; readonly completedCount: number;
  readonly assetId: string | null; readonly assetName: string;
  readonly deletedAt: string | null; readonly deletedBy: string | null; readonly deletedReason: string | null;
}
export interface RouteStop {
  readonly id: string; readonly routeId: string; readonly stopOrder: number;
  readonly clientName: string; readonly address: string; readonly city: string | null;
  readonly serviceType: string; readonly scheduledTime: string; readonly phone: string | null;
  readonly customerId: string | null;
  readonly estimatedAmount: number; readonly actualAmount: number | null;
  readonly paymentMethodId: string | null; readonly status: string;
  readonly notes: string | null; readonly completedAt: string | null;
  readonly evidenceUrls: string[]; readonly amountReceived: number | null;
  readonly changeAmount: number | null; readonly pendingCollection: boolean;
  readonly evidenceBefore: string[]; readonly evidenceAfter: string[];
  readonly lat: number | null; readonly lng: number | null;
}
// status NO va en el form: el estado del día se DERIVA de los stops (B.3.c/120). Ver deriveDayStatus.
export interface RouteFormData { routeDate: string; assignedTo: string; notes: string; assetId: string; }
export interface StopFormData {
  clientName: string; address: string; city: string; serviceType: string;
  scheduledTime: string; estimatedAmount: number; notes: string; phone: string; customerId: string | null;
}
export interface CompletePayload { amount: number; paymentMethodId: string; received: number | null; change: number | null; evidence: string[]; }
export type EditableStop = StopFormData & { id?: string };
export type StopPatch = Partial<StopFormData> & { status?: string; completedAt?: string | null; stopOrder?: number; evidenceUrls?: string[]; evidenceBefore?: string[]; evidenceAfter?: string[]; lat?: number | null; lng?: number | null };
export interface StopSupply { readonly itemId: string; readonly name: string; readonly quantity: number; }
export interface SupplyUse { itemId: string; quantity: number; }

export interface IRouteRepository {
  recordPayment(stopId: string, p: CompletePayload): Promise<RepoResult>;
  completeStop(stopId: string): Promise<RepoResult>;
  saveStopEvidence(stopId: string, phase: "before" | "after", paths: string[]): Promise<RepoResult>;
  setNotAttended(stopId: string, reason: string): Promise<RepoResult>;
  listRoutes(date: string): Promise<readonly ServiceRoute[]>;
  listStops(routeId: string): Promise<readonly RouteStop[]>;
  create(d: RouteFormData, stops: readonly StopFormData[]): Promise<RepoResult>;
  update(id: string, d: RouteFormData): Promise<RepoResult>;
  voidRow(id: string, reason: string): Promise<RepoResult>;  // VOID vía RPC void_route (+ cascada stops)
  remove(id: string): Promise<RepoResult>;                   // hard delete (solo CEO, ya anulada)
  addStop(routeId: string, order: number, s: StopFormData): Promise<RepoResult>;
  updateStop(id: string, patch: StopPatch): Promise<RepoResult>;
  removeStop(id: string): Promise<RepoResult>;
  reorderStops(orderedIds: readonly string[]): Promise<RepoResult>;
  recordSupplies(stopId: string, items: SupplyUse[]): Promise<RepoResult>;
  listSupplies(stopId: string): Promise<readonly StopSupply[]>;
}
