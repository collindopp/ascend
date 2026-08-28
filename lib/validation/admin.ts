import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(200),
  role: z.enum(["ADMIN", "MANAGER", "SETTER"]),
  teamId: z.string().min(1).nullable().optional(),
});

export const setLeadListAssignmentsSchema = z.object({
  leadListId: z.string().min(1),
  setterIds: z.array(z.string().min(1)).max(500),
});

export const updateUserSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["ADMIN", "MANAGER", "SETTER"]).optional(),
  teamId: z.string().min(1).nullable().optional(),
  active: z.boolean().optional(),
});

export const createTeamSchema = z.object({
  name: z.string().trim().min(1).max(120),
});

export const createLeadListSchema = z.object({
  name: z.string().trim().min(1).max(160),
  source: z.string().trim().min(1).max(120),
  location: z.string().trim().max(120).optional(),
  description: z.string().trim().max(500).optional(),
  leadCount: z.coerce.number().int().nonnegative().optional(),
  externalId: z.string().trim().max(120).optional(),
  tags: z.string().trim().max(300).optional(),
});

export const updateLeadListStatusSchema = z.object({
  leadListId: z.string().min(1),
  status: z.enum(["ACTIVE", "ARCHIVED"]),
});

export const upsertSystemSettingSchema = z.object({
  key: z.string().trim().min(1).max(120),
  value: z.string().trim().min(1).max(2000),
});
