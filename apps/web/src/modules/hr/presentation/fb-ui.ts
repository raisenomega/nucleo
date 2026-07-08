import type { TranslationKey } from "@shared/i18n";
import type { FeedbackType } from "@hr/domain/feedback.types";

export const FB_TYPES: FeedbackType[] = ["suggestion", "praise", "concern", "culture", "anonymous_tip"];
export const FB_KEY: Record<FeedbackType, TranslationKey> = {
  suggestion: "fbSuggestion", praise: "fbPraise", concern: "fbConcern", culture: "fbCulture", anonymous_tip: "fbTip",
};
export const FB_COLOR: Record<FeedbackType, string> = {
  suggestion: "bg-blue-100 text-blue-800", praise: "bg-green-100 text-green-800",
  concern: "bg-red-100 text-red-800", culture: "bg-purple-100 text-purple-800", anonymous_tip: "bg-secondary",
};
