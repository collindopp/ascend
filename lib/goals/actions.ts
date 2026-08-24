"use server";

import { prisma } from "@/lib/db/client";
import { requireActionRole } from "@/lib/auth/guard";
import { getCurrentWeekRange, getWeeklyGoalProgress, type WeeklyGoalRow } from "@/lib/goals/queries";
import { setWeeklyGoalSchema } from "@/lib/validation/goals";
import type { ActionResult } from "@/lib/sessions/actions";

/** Sets (or updates) a rep's goal for the current week — always this week, never past weeks. */
export async function setWeeklyGoalAction(input: unknown): Promise<ActionResult> {
  await requireActionRole(["MANAGER", "ADMIN"]);

  const parsed = setWeeklyGoalSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Enter a valid goal (0–1000)." };

  const setter = await prisma.user.findFirst({
    where: { id: parsed.data.setterId, role: { in: ["SETTER", "ADMIN"] } },
  });
  if (!setter) return { ok: false, error: "Setter not found." };

  const { start } = getCurrentWeekRange();
  await prisma.weeklyGoal.upsert({
    where: { setterId_weekStart: { setterId: setter.id, weekStart: start } },
    update: { target: parsed.data.target },
    create: { setterId: setter.id, weekStart: start, target: parsed.data.target },
  });

  return { ok: true, data: undefined };
}

export type FetchWeeklyGoalProgressResult = { ok: true; data: WeeklyGoalRow[] } | { ok: false; error: string };

/** Polled by the leaderboard's goals board — visible to setters too, same as the rest of the leaderboard. */
export async function fetchWeeklyGoalProgress(): Promise<FetchWeeklyGoalProgressResult> {
  await requireActionRole(["SETTER", "MANAGER", "ADMIN"]);
  const data = await getWeeklyGoalProgress();
  return { ok: true, data };
}
