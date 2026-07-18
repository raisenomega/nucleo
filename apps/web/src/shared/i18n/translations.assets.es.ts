import type { TranslationKey } from "./translations.keys";

// Diccionario del módulo Activos. Se fusiona en translations.ts.
export const esAssets = {
  newAsset: "Nuevo activo", assetType: "Tipo",
  atVehicle: "Vehículo", atEquipment: "Equipo", atTool: "Herramienta", atFurniture: "Mobiliario", atTechnology: "Tecnología", atProperty: "Propiedad", atOther: "Otro",
  condition: "Condición", cNew: "Nuevo", cGood: "Bueno", cFair: "Regular", cPoor: "Malo", cOutOfService: "Fuera de servicio",
  stActive: "Activo", stInUse: "En uso", stMaintenance: "Mantenimiento", stRetired: "Retirado", stSold: "Vendido", stLost: "Perdido",
  serialNumber: "N° de serie", model: "Modelo", brand: "Marca", purchaseDate: "Fecha de compra", purchasePrice: "Precio de compra", currentValue: "Valor actual",
  depMethod: "Método depreciación", depNone: "Ninguna", depStraight: "Lineal", depYears: "Años depreciación", warrantyExpires: "Garantía vence",
  insurancePolicy: "Póliza de seguro", insuranceExpires: "Seguro vence", imageUrl: "Imagen (URL)",
  totalAssets: "Total activos", assetsValue: "Valor total", inMaintenance: "En mantenimiento",
  fVehicles: "Vehículos", fEquipment: "Equipos", fTools: "Herramientas", fMaintenance: "En mantenimiento", fRetired: "Retirados",
  registerMaintenance: "Registrar mantenimiento", maintenanceHistory: "Historial de mantenimiento", maintenanceType: "Tipo",
  mtPreventive: "Preventivo", mtCorrective: "Correctivo", mtInspection: "Inspección", performedBy: "Realizado por", performedAt: "Fecha", nextDue: "Próximo",
  cost: "Costo", secPurchase: "Compra y valor", secAssignment: "Asignación y estado", secInsurance: "Seguro y garantía",
  noAssets: "Sin activos", warrantyAlert: "Garantía por vencer", maintenanceAlert: "Mantenimiento vencido",
  checkout: "Salida (checkout)", checkin: "Devolución (checkin)", assignCheckout: "Asignar / Checkout", receiveCheckin: "Recibir / Checkin", inUseBy: "En uso por", custodyHistory: "Historial de uso",
  odometer: "Odómetro (millas)", milesTraveled: "Millas recorridas", fuelLevel: "Nivel gasolina", fuelType: "Tipo gasolina", gallons: "Galones", gpsEnabled: "GPS activado",
  routeSummary: "Resumen de ruta", stopsCount: "N° de paradas", cargoDescription: "Descripción de carga", conditionNotes: "Condición al devolver", exitPhotos: "Fotos al salir", returnPhotos: "Fotos al devolver",
  milesExcess: "Exceso de millas", flEmpty: "Vacío", flQuarter: "1/4", flHalf: "1/2", flThreeQuarter: "3/4", flFull: "Lleno",
  chartMiles: "Millas por mes", chartFuel: "Galones por mes", chartUseByEmployee: "Uso por empleado", assetReport: "Reporte activos", miles: "Millas",
  secGps: "GPS", gpsDeviceId: "ID del dispositivo", gpsProvider: "Proveedor GPS", gps: "GPS", gpsReady: "Preparado — conectar dispositivo GPS",
  generatePdf: "Generar PDF", routesDone: "Rutas realizadas", printReceipt: "Imprimir recibo",
} satisfies Partial<Record<TranslationKey, string>>;
