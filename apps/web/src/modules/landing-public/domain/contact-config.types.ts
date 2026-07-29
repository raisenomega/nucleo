// Config editable de la sección "Contáctanos" (guardada en tenant_landing_config.contact_config jsonb).
// Todo opcional: undefined/null → defaults (sección + ambas tarjetas visibles, textos por i18n).
export interface ContactConfig {
  enabled?: boolean; showMessage?: boolean; showVisit?: boolean;
  msgTitle?: string; msgDesc?: string; msgBtn?: string;
  visitTitle?: string; visitDesc?: string; visitBtn?: string;
}
