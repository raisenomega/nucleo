import { useCallback, useEffect, useState } from "react";
import type { IFeedbackRepository, Feedback, FeedbackType } from "@hr/domain/feedback.types";

export function useFeedback(repo: IFeedbackRepository) {
  const [list, setList] = useState<Feedback[]>([]);
  const load = useCallback(async () => { setList(await repo.list()); }, [repo]);
  useEffect(() => { void load(); }, [load]);
  const save = useCallback(async (targetId: string | null, type: FeedbackType, content: string, anon: boolean) => {
    const r = await repo.save(targetId, type, content, anon); if (r.ok) await load(); return r;
  }, [repo, load]);
  const acknowledge = useCallback(async (id: string) => { const r = await repo.acknowledge(id); if (r.ok) await load(); return r; }, [repo, load]);
  return { list, save, acknowledge };
}
