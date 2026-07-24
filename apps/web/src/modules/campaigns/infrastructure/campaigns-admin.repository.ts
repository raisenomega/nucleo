import { supabase } from "@shared/lib/supabase";
import { mapPage } from "@campaigns/infrastructure/campaigns-public.repository";
import type { CampaignListItem, CampaignPageData } from "@campaigns/domain/campaign.types";

type J = Record<string, unknown>;

export async function listCampaignPages(): Promise<CampaignListItem[]> {
  const { data } = await supabase.rpc("list_campaign_pages");
  return (Array.isArray(data) ? (data as J[]) : []).map((p) => ({
    id: p.id as string, name: p.name as string, slug: p.slug as string,
    isPublished: p.is_published === true, updatedAt: p.updated_at as string, blocks: Number(p.blocks ?? 0),
  }));
}

export async function getCampaignAdmin(id: string): Promise<CampaignPageData | null> {
  const { data } = await supabase.rpc("get_campaign_page_admin", { _id: id });
  return data ? mapPage(data as J) : null;
}

// Devuelve el id de la página (o el mensaje de error del RPC: INVALID_SLUG / unique_violation / NOT_AUTHORIZED).
export async function upsertPage(payload: J): Promise<{ id?: string; error?: string }> {
  const { data, error } = await supabase.rpc("upsert_campaign_page", { _payload: payload });
  return error ? { error: error.message } : { id: data as string };
}
export async function publishPage(id: string, published: boolean): Promise<void> {
  await supabase.rpc("publish_campaign_page", { _id: id, _published: published });
}
export async function deletePage(id: string): Promise<void> {
  await supabase.rpc("delete_campaign_page", { _id: id });
}
export async function upsertBlock(payload: J): Promise<void> {
  await supabase.rpc("upsert_campaign_block", { _payload: payload });
}
export async function deleteBlock(id: string): Promise<void> {
  await supabase.rpc("delete_campaign_block", { _id: id });
}
export async function reorderBlocks(pageId: string, orderedIds: string[]): Promise<void> {
  await supabase.rpc("reorder_campaign_blocks", { _page_id: pageId, _ordered_ids: orderedIds });
}
