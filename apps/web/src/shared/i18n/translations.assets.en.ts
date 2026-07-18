import type { TranslationKey } from "./translations.keys";

// Assets module dictionary. Merged in translations.ts.
export const enAssets = {
  newAsset: "New asset", assetType: "Type",
  atVehicle: "Vehicle", atEquipment: "Equipment", atTool: "Tool", atFurniture: "Furniture", atTechnology: "Technology", atProperty: "Property", atOther: "Other",
  condition: "Condition", cNew: "New", cGood: "Good", cFair: "Fair", cPoor: "Poor", cOutOfService: "Out of service",
  stActive: "Active", stInUse: "In use", stMaintenance: "Maintenance", stRetired: "Retired", stSold: "Sold", stLost: "Lost",
  serialNumber: "Serial number", model: "Model", brand: "Brand", purchaseDate: "Purchase date", purchasePrice: "Purchase price", currentValue: "Current value",
  depMethod: "Depreciation method", depNone: "None", depStraight: "Straight line", depYears: "Depreciation years", warrantyExpires: "Warranty expires",
  insurancePolicy: "Insurance policy", insuranceExpires: "Insurance expires", imageUrl: "Image (URL)",
  totalAssets: "Total assets", assetsValue: "Total value", inMaintenance: "In maintenance",
  fVehicles: "Vehicles", fEquipment: "Equipment", fTools: "Tools", fMaintenance: "In maintenance", fRetired: "Retired",
  registerMaintenance: "Register maintenance", maintenanceHistory: "Maintenance history", maintenanceType: "Type",
  mtPreventive: "Preventive", mtCorrective: "Corrective", mtInspection: "Inspection", performedBy: "Performed by", performedAt: "Date", nextDue: "Next due",
  cost: "Cost", secPurchase: "Purchase & value", secAssignment: "Assignment & status", secInsurance: "Insurance & warranty",
  noAssets: "No assets", warrantyAlert: "Warranty expiring", maintenanceAlert: "Maintenance overdue",
  checkout: "Checkout", checkin: "Checkin", assignCheckout: "Assign / Checkout", receiveCheckin: "Receive / Checkin", inUseBy: "In use by", custodyHistory: "Usage history",
  odometer: "Odometer (miles)", milesTraveled: "Miles traveled", fuelLevel: "Fuel level", fuelType: "Fuel type", gallons: "Gallons", gpsEnabled: "GPS enabled",
  routeSummary: "Route summary", stopsCount: "Stops", cargoDescription: "Cargo description", conditionNotes: "Return condition", exitPhotos: "Exit photos", returnPhotos: "Return photos",
  milesExcess: "Miles excess", flEmpty: "Empty", flQuarter: "1/4", flHalf: "1/2", flThreeQuarter: "3/4", flFull: "Full",
  chartMiles: "Miles per month", chartFuel: "Gallons per month", chartUseByEmployee: "Use by employee", assetReport: "Assets report", miles: "Miles",
} satisfies Partial<Record<TranslationKey, string>>;
