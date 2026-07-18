import type { TranslationKey } from "@shared/i18n";
import type { AssetType, AssetCondition, AssetStatus, MaintenanceType } from "@assets/domain/asset.types";

export const ASSET_TYPE: Record<AssetType, TranslationKey> = { vehicle: "atVehicle", equipment: "atEquipment", tool: "atTool", furniture: "atFurniture", technology: "atTechnology", property: "atProperty", other: "atOther" };
export const CONDITION: Record<AssetCondition, TranslationKey> = { new: "cNew", good: "cGood", fair: "cFair", poor: "cPoor", out_of_service: "cOutOfService" };
export const STATUS: Record<AssetStatus, { key: TranslationKey; cls: string }> = {
  active: { key: "stActive", cls: "bg-green-500/10 text-green-600" }, maintenance: { key: "stMaintenance", cls: "bg-amber-500/10 text-amber-600" },
  retired: { key: "stRetired", cls: "bg-secondary text-muted-foreground" }, sold: { key: "stSold", cls: "bg-blue-500/10 text-blue-600" }, lost: { key: "stLost", cls: "bg-destructive/10 text-destructive" },
  in_use: { key: "stInUse", cls: "bg-blue-500/10 text-blue-600" },
};
export const MAINT_TYPE: Record<MaintenanceType, TranslationKey> = { preventive: "mtPreventive", corrective: "mtCorrective", inspection: "mtInspection" };
export const FUEL: [string, TranslationKey][] = [["empty", "flEmpty"], ["quarter", "flQuarter"], ["half", "flHalf"], ["three_quarter", "flThreeQuarter"], ["full", "flFull"]];
