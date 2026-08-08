import { z } from "zod";

export const startSessionSchema = z.object({
  leadListId: z.string().min(1),
});

export const sessionIdSchema = z.object({
  sessionId: z.string().min(1),
});

export const recordEventSchema = z.object({
  sessionId: z.string().min(1),
  type: z.enum(["DIAL", "CONVERSATION", "APPOINTMENT"]),
});
