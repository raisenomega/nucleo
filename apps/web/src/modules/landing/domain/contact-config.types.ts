// Sección "Contáctanos" editable (jsonb contact_config). Todo opcional → defaults (visible, textos por i18n).
export interface ContactConfig {
  enabled?: boolean; showMessage?: boolean; showVisit?: boolean;
  msgTitle?: string; msgDesc?: string; msgBtn?: string;
  visitTitle?: string; visitDesc?: string; visitBtn?: string;
}
