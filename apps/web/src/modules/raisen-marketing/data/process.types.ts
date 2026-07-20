// Paso del proceso (camelCase) + config de la sección. La landing lee; el editor /web/proceso escribe.
export interface ProcessStepRow {
  id: string; stepNumber: number; iconName: string;
  titleEs: string; titleEn: string;
  descEs: string; descEn: string;
  displayOrder: number; isActive: boolean;
}
export interface ProcessConfig { id: string; eyebrowEs: string; eyebrowEn: string; titleEs: string; titleEn: string }
export type ProcessStepDraft = Omit<ProcessStepRow, "id"> & { id?: string };
