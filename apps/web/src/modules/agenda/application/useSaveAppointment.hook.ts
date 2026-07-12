import { useState } from "react";
import type { IAppointmentsRepository, AppointmentInput, SaveResult } from "@agenda/domain/appointment.types";

export function useSaveAppointment(repo: IAppointmentsRepository) {
  const [busy, setBusy] = useState(false);
  async function save(id: string | null, input: AppointmentInput): Promise<SaveResult> {
    setBusy(true); const r = await repo.save(id, input); setBusy(false); return r;
  }
  return { busy, save };
}
