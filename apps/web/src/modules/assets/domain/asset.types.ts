// BC assets — activos (equipos/vehículos/herramientas) + bitácora de mantenimiento. Puro.
export type Result<T, E> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };

export type AssetType = "vehicle" | "equipment" | "tool" | "furniture" | "technology" | "property" | "other";
export type AssetCondition = "new" | "good" | "fair" | "poor" | "out_of_service";
export type AssetStatus = "active" | "maintenance" | "retired" | "sold" | "lost";
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
}
export type AssetFormData = Omit<Asset, "id" | "assignedToName">;
export interface ProfileRef { readonly id: string; readonly name: string; }

export interface MaintenanceLog {
  readonly id: string; readonly maintenanceType: MaintenanceType; readonly description: string;
  readonly cost: number; readonly performedBy: string; readonly performedAt: string; readonly nextDue: string | null; readonly notes: string;
}
export type MaintenanceFormData = Omit<MaintenanceLog, "id">;

export interface IAssetRepository {
  list(): Promise<Result<Asset[], string>>;
  create(data: AssetFormData): Promise<Result<Asset, string>>;
  update(id: string, data: AssetFormData): Promise<Result<Asset, string>>;
  remove(id: string): Promise<Result<null, string>>;
  listMaintenance(assetId: string): Promise<MaintenanceLog[]>;
  addMaintenance(assetId: string, data: MaintenanceFormData): Promise<Result<null, string>>;
}
