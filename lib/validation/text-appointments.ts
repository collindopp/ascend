import { z } from "zod";

export const logTextAppointmentSchema = z.object({
  leadListId: z.string().min(1),
  note: z.string().trim().max(200).optional(),
});
