import type { DefaultSession } from "next-auth";
import type { Role } from "@/lib/generated/prisma/enums";

declare module "next-auth" {
  interface User {
    role: Role;
    teamId: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      teamId: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    teamId: string | null;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
    teamId: string | null;
  }
}
