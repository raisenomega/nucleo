import { supabase } from "@shared/lib/supabase";

// v2a.5 · Lectura pública del contrato firmado por token (anon, molde de get_public_invoice / get_public_order).
// INFRA DORMIDA: hoy nadie llama a esto salvo la propia página /contrato/{token}; v2a.6 la enlaza desde el
// flujo de aceptación. Vive en @orders porque el contrato cuelga de una orden (order_id/form_id de la fila).
//
// get_public_contract devuelve DOS formas de jsonb y NO trae `status` como el de factura: o el payload
// completo, o { error }. Se modela como unión discriminada por la presencia de `error` en vez de aplanarlo
// a un objeto con todo opcional: así el componente no puede pintar por descuido un contrato a medias
// (un contrato es prueba legal; medio contrato en pantalla es peor que ninguno).
export interface PublicContract {
  contract_number: string; signed_at: string; signer_name: string; signer_email: string; locale: string;
  terms: string; terms_summary: string | null; terms_hash: string; ip_address: string | null;
  // El branding sale del LEFT JOIN a tenant_themes → puede venir null si el tenant no tiene tema; la vista
  // decide el fallback (aquí no, porque los defaults de marca no son asunto de la capa de datos).
  tenant_name: string | null; primary_color: string | null; accent_color: string | null; logo_url: string | null;
}
export interface PublicContractError { error: string }
export type PublicContractResp = PublicContract | PublicContractError;

export const isContractError = (r: PublicContractResp): r is PublicContractError => "error" in r;

export async function getContractByToken(token: string): Promise<PublicContractResp> {
  const { data, error } = await supabase.rpc("get_public_contract", { p_token: token });
  // Fallo de red o de RPC se degrada a 'not_found': para el firmante el resultado observable es idéntico
  // (no hay contrato que ver) y una página pública sin auth no debe filtrar el detalle del backend.
  if (error || !data) return { error: "not_found" };
  return data as PublicContractResp;
}
