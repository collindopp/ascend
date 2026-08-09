import { z } from "zod";

export const startSessionSchema = z.object({
  leadListId: z.string().min(1),
});

export const sessionIdSchema = z.object({
  sessionId: z.string().min(1),
});

// DIAL is intentionally excluded — dials come from the external dialer, never a manual tap.
export const recordEventSchema = z.object({
  sessionId: z.string().min(1),
  type: z.enum(["CONVERSATION", "APPOINTMENT", "DQ", "WRONG_NUMBER"]),
});
