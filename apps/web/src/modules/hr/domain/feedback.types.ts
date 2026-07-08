// BC hr — feedback del empleado (opiniones/cultura). Puro.
export type FbResult = { ok: true } | { ok: false; error: string };
export type FeedbackType = "suggestion" | "praise" | "concern" | "culture" | "anonymous_tip";

export interface Feedback {
  readonly id: string; readonly authorId: string; readonly targetId: string | null;
  readonly feedbackType: FeedbackType; readonly content: string; readonly isAnonymous: boolean;
  readonly aiSentiment: string | null; readonly acknowledgedAt: string | null; readonly createdAt: string;
}

export interface IFeedbackRepository {
  list(): Promise<Feedback[]>;
  listForTarget(targetId: string): Promise<Feedback[]>;
  save(targetId: string | null, type: FeedbackType, content: string, isAnonymous: boolean): Promise<FbResult>;
  acknowledge(id: string): Promise<FbResult>;
}
