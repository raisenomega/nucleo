// BC assets — activos (equipos/vehículos/herramientas) + bitácora de mantenimiento. Puro.
export type Result<T, E> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };

export type AssetType = "vehicle" | "equipment" | "tool" | "furniture" | "technology" | "property" | "other";
export type AssetCondition = "new" | "good" | "fair" | "poor" | "out_of_service";
export type AssetStatus = "active" | "maintenance" | "retired" | "sold" | "lost" | "in_use";
export type MaintenanceType = "preventive" | "corrective" | "inspection";

export interface Asset {
  readonly id: string; readonly name: string; readonly assetType: AssetType; readonly category: string;
  readonly serialNumber: string; readonly model: string; readonly brand: string;
  readonly purchaseDate: string | null; readonly purchasePrice: number | null; readonly currentValue: number | null;
  readonly depreciationMethod: string; readonly depreciationYears: number | null; readonly warrantyExpires: string | null;
  readonly condition: AssetCondition; readonly status: AssetStatus;
  readonly assignedTo: string | null; readonly assignedToName: string;
  readonly location: string; readonly insurancePolicy: string; readonly insuranceExpires: string | null;
  readonly notes: string; readonly imageUrl: string; readonly active: boolean;
  readonly gpsEnabled: boolean; readonly gpsDeviceId: string; readonly gpsProvider: string;
}
export type AssetFormData = Omit<Asset, "id" | "assignedToName">;
export interface ProfileRef { readonly id: string; readonly name: string; }
export interface AssetRoute { readonly id: string; readonly routeDate: string; readonly status: string; readonly stopsCount: number; }
export interface GpsLog { readonly latitude: number; readonly longitude: number; readonly speed: number | null; readonly accuracy: number | null; readonly recordedAt: string; readonly custodyLogId: string | null; }

export interface MaintenanceLog {
  readonly id: string; readonly maintenanceType: MaintenanceType; readonly description: string;
  readonly cost: number; readonly performedBy: string; readonly performedAt: string; readonly nextDue: string | null; readonly notes: string;
}
export type MaintenanceFormData = Omit<MaintenanceLog, "id">;

export type CustodyType = "checkout" | "checkin";
export interface CustodyLog {
  readonly id: string; readonly employeeId: string; readonly employeeName: string; readonly custodyType: CustodyType; readonly custodyAt: string;
  readonly odometer: number | null; readonly fuelLevel: string; readonly fuelType: string; readonly fuelGallons: number | null; readonly gpsEnabled: boolean;
  readonly routeSummary: string; readonly cargoDescription: string; readonly stopsCount: number | null; readonly conditionNotes: string; readonly evidenceUrls: readonly string[]; readonly notes: string;
}
export interface CheckoutData { readonly employeeId: string; readonly odometer: number | null; readonly fuelLevel: string; readonly fuelType: string; readonly gps: boolean; readonly notes: string; readonly evidence: string[]; }
export interface CheckinData { readonly odometer: number | null; readonly fuelLevel: string; readonly gallons: number | null; readonly route: string; readonly stops: number | null; readonly cargo: string; readonly condition: string; readonly notes: string; readonly evidence: string[]; }

export interface IAssetRepository {
  list(): Promise<Result<Asset[], string>>;
  create(data: AssetFormData): Promise<Result<Asset, string>>;
  update(id: string, data: AssetFormData): Promise<Result<Asset, string>>;
  remove(id: string): Promise<Result<null, string>>;
  listMaintenance(assetId: string): Promise<MaintenanceLog[]>;
  addMaintenance(assetId: string, data: MaintenanceFormData): Promise<Result<null, string>>;
  checkout(assetId: string, data: CheckoutData): Promise<Result<string | null, string>>;
  checkin(assetId: string, data: CheckinData): Promise<Result<string | null, string>>;
  listCustody(assetId: string): Promise<CustodyLog[]>;
  listRoutes(assetId: string): Promise<AssetRoute[]>;
  listGpsLogs(assetId: string): Promise<GpsLog[]>;
}
