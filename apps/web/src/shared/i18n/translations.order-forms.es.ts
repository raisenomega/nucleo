import type { TranslationKey } from "./translations.keys";

export const esOrderForms = {
  landingOrderForms: "Formularios", ofCreate: "Crear nuevo", ofCreateTitle: "Nuevo formulario", ofName: "Nombre", ofDescription: "Descripción",
  ofFields: "Campos", ofFieldCount: "{n} campos", ofCreatedAt: "Creado", ofDefault: "Default", ofDuplicate: "Duplicar", ofMakeDefault: "Marcar default",
  ofEmptyTitle: "Aún no hay formularios", ofEmptyDesc: "Creá el primero para recibir órdenes con datos personalizados.",
  ofDeleteConfirm: "¿Eliminar este formulario y todos sus campos?", ofErr: "No se pudo completar la acción", ofErrName: "El nombre debe tener al menos 3 caracteres", ofErrLabel: "Cada campo necesita un label en español",
  ofUnsaved: "Sin guardar", ofBasic: "Básicos", ofAdvanced: "Avanzados", ofSoon: "Pronto", ofUntitled: "Formulario sin título", ofDropHint: "Agregá campos desde la paleta de la izquierda.",
  ofCondBadge: "Condicional", ofSelectField: "Seleccioná un campo del preview para editar sus propiedades.", ofFieldSettings: "Propiedades del campo", ofDeleteField: "Eliminar campo",
  ofLabelEs: "Label (ES)", ofLabelEn: "Label (EN)", ofPlaceholderEs: "Placeholder (ES)", ofPlaceholderEn: "Placeholder (EN)", ofGroup: "Grupo", ofRequired: "Obligatorio",
  ofOptions: "Opciones", ofAddOption: "Agregar opción", ofMin: "Mínimo", ofMax: "Máximo", ofRows: "Filas", ofStep: "Paso", ofPattern: "Patrón (regex)", ofDefaultChecked: "Marcado por default",
  ofCondToggle: "Mostrar solo si otro campo tiene un valor", ofCondValue: "Valor",
  ofKindText: "Texto corto", ofKindEmail: "Email", ofKindTel: "Teléfono", ofKindTextarea: "Texto largo", ofKindNumber: "Número", ofKindSelect: "Selección", ofKindRadio: "Opciones", ofKindCheckbox: "Casilla",
  ofKindDate: "Fecha", ofKindAddress: "Dirección completa", ofKindMatrix: "Matriz de precios", ofKindAddons: "Complementos", ofKindRepeatable: "Grupo repetible", ofKindFile: "Subir archivo",
  ofItemFormLabel: "Formulario de pedido", ofItemFormDefault: "— Usar formulario default —",
  ofItemFormHint: "El formulario que verá el cliente al ordenar este item. Default = el formulario del tenant marcado como default.",
  ofDepsTitle: "No podés eliminar este formulario", ofDepsBody: "{n} items del catálogo lo están usando. Reasignalos antes de eliminar.", ofClose: "Cerrar",
} satisfies Partial<Record<TranslationKey, string>>;
