import { supabase } from "@shared/lib/supabase";
import type { IFeedbackRepository, Feedback, FeedbackType, FbResult } from "@hr/domain/feedback.types";

interface Row {
  id: string; author_id: string; target_id: string | null; feedback_type: string; content: string;
  is_anonymous: boolean; ai_sentiment: string | null; acknowledged_at: string | null; created_at: string;
}
const SEL = "id,author_id,target_id,feedback_type,content,is_anonymous,ai_sentiment,acknowledged_at,created_at";
const toFb = (r: Row): Feedback => ({
  id: r.id, authorId: r.author_id, targetId: r.target_id, feedbackType: r.feedback_type as FeedbackType,
  content: r.content, isAnonymous: r.is_anonymous, aiSentiment: r.ai_sentiment,
  acknowledgedAt: r.acknowledged_at, createdAt: r.created_at,
});
const ok = (e: { message: string } | null): FbResult => (e ? { ok: false, error: e.message } : { ok: true });

export const supabaseFeedbackRepository: IFeedbackRepository = {
  async list(): Promise<Feedback[]> {
    const { data } = await supabase.from("employee_feedback").select(SEL).order("created_at", { ascending: false });
    return ((data as Row[] | null) ?? []).map(toFb);
  },
  async listForTarget(targetId): Promise<Feedback[]> {
    const { data } = await supabase.from("employee_feedback").select(SEL).eq("target_id", targetId).order("created_at", { ascending: false });
    return ((data as Row[] | null) ?? []).map(toFb);
  },
  async save(targetId, type, content, isAnonymous): Promise<FbResult> {
    return ok((await supabase.from("employee_feedback").insert({
      target_id: targetId, feedback_type: type, content, is_anonymous: isAnonymous,
    })).error);
  },
  async acknowledge(id): Promise<FbResult> {
    return ok((await supabase.rpc("acknowledge_feedback", { p_id: id })).error);
  },
};
