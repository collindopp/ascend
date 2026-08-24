import { z } from "zod";

export const setWeeklyGoalSchema = z.object({
  setterId: z.string().min(1),
  target: z.coerce.number().int().min(0).max(1000),
});
