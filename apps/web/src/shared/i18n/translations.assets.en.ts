import type { TranslationKey } from "./translations.keys";

// Assets module dictionary. Merged in translations.ts.
export const enAssets = {
  newAsset: "New asset", assetType: "Type",
  atVehicle: "Vehicle", atEquipment: "Equipment", atTool: "Tool", atFurniture: "Furniture", atTechnology: "Technology", atProperty: "Property", atOther: "Other",
  condition: "Condition", cNew: "New", cGood: "Good", cFair: "Fair", cPoor: "Poor", cOutOfService: "Out of service",
  stActive: "Active", stMaintenance: "Maintenance", stRetired: "Retired", stSold: "Sold", stLost: "Lost",
  serialNumber: "Serial number", model: "Model", brand: "Brand", purchaseDate: "Purchase date", purchasePrice: "Purchase price", currentValue: "Current value",
  depMethod: "Depreciation method", depNone: "None", depStraight: "Straight line", depYears: "Depreciation years", warrantyExpires: "Warranty expires",
  insurancePolicy: "Insurance policy", insuranceExpires: "Insurance expires", imageUrl: "Image (URL)",
  totalAssets: "Total assets", assetsValue: "Total value", inMaintenance: "In maintenance",
  fVehicles: "Vehicles", fEquipment: "Equipment", fTools: "Tools", fMaintenance: "In maintenance", fRetired: "Retired",
  registerMaintenance: "Register maintenance", maintenanceHistory: "Maintenance history", maintenanceType: "Type",
  mtPreventive: "Preventive", mtCorrective: "Corrective", mtInspection: "Inspection", performedBy: "Performed by", performedAt: "Date", nextDue: "Next due",
  cost: "Cost", secPurchase: "Purchase & value", secAssignment: "Assignment & status", secInsurance: "Insurance & warranty",
  noAssets: "No assets", warrantyAlert: "Warranty expiring", maintenanceAlert: "Maintenance overdue",
} satisfies Partial<Record<TranslationKey, string>>;
