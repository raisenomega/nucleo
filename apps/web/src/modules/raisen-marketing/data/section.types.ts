// Visibilidad + orden de una sección de la landing (keys fijos). La landing lee; /web/secciones togglea/reordena.
export interface SectionRow {
  id: string; key: string;
  labelEs: string; labelEn: string;
  isVisible: boolean; order: number;
}
