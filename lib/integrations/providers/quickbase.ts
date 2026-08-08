import "server-only";
import { prisma } from "@/lib/db/client";
import type { IntegrationProvider } from "@/lib/integrations/types";
import type { IntegrationStatus, IntegrationJobType } from "@/lib/generated/prisma/enums";

/**
 * Stub provider — no live Quickbase API calls. Future use per section 23:
 * push performance data, pull lead information, sync appointment outcomes,
 * possibly sync users. Credentials (when implemented) come only from
 * QUICKBASE_CLIENT_ID / QUICKBASE_CLIENT_SECRET env vars, never hardcoded.
 */
export class QuickbaseProvider implements IntegrationProvider {
  readonly name = "QUICKBASE" as const;

  isConfigured(): boolean {
    return Boolean(process.env.QUICKBASE_CLIENT_ID && process.env.QUICKBASE_CLIENT_SECRET);
  }

  async getStatus(): Promise<IntegrationStatus> {
    const config = await prisma.integrationConfig.findUnique({ where: { provider: this.name } });
    return config?.status ?? "NOT_CONNECTED";
  }

  async connect(): Promise<void> {
    throw new Error("Quickbase integration is not implemented yet.");
  }

  async sync(_jobType: IntegrationJobType): Promise<void> {
    throw new Error("Quickbase integration is not implemented yet.");
  }
}
