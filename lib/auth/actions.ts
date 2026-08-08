"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import { loginSchema } from "@/lib/validation/auth";
import { checkRateLimit } from "@/lib/rate-limit/memory";
import { writeAuditLog } from "@/lib/audit/log";
import { prisma } from "@/lib/db/client";

export type LoginState = { error?: string } | undefined;

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  const ip = (await headers()).get("x-forwarded-for") ?? "local";
  const { allowed } = checkRateLimit(`login:${ip}:${parsed.data.email}`, {
    windowMs: 60_000,
    max: 5,
  });
  if (!allowed) {
    return { error: "Too many attempts. Wait a minute and try again." };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error;
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } });
  if (user) {
    await writeAuditLog({ actorId: user.id, action: "LOGIN", entityType: "User", entityId: user.id });
  }

  redirect("/");
}

export async function logout() {
  await signOut({ redirect: false });
  redirect("/login");
}
