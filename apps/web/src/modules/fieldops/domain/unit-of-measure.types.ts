// BC fieldops — unidad de medida (UOM). Tabla propia (no categories): abreviatura + grupo + conversión futura.
import type { Result } from "@fieldops/domain/inventory.types";

export type UomGroup = "count" | "volume" | "weight" | "length" | "area" | "time" | "other";

export interface UnitOfMeasure {
  readonly id: string; readonly tenantId: string;
  readonly name: string; readonly abbreviation: string; readonly uomGroup: UomGroup;
  readonly baseUnitId: string | null; readonly conversionFactor: number | null;
  readonly isDefault: boolean; readonly active: boolean;
}

export interface UomFormData {
  readonly name: string; readonly abbreviation: string; readonly uomGroup: UomGroup; readonly active: boolean;
}

// Puerto — lo implementa infrastructure; lo consume application (DI).
export interface IUnitOfMeasureRepository {
  list(): Promise<Result<UnitOfMeasure[], string>>;
  create(d: UomFormData): Promise<Result<UnitOfMeasure, string>>;
  update(id: string, d: UomFormData): Promise<Result<UnitOfMeasure, string>>;
  remove(id: string): Promise<Result<null, string>>;
}
