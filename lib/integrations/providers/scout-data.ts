import "server-only";
import { prisma } from "@/lib/db/client";
import type { IntegrationProvider } from "@/lib/integrations/types";
import type { IntegrationStatus, IntegrationJobType } from "@/lib/generated/prisma/enums";

/**
 * Stub provider — no live Scout Data API calls. Future use per section 23:
 * import lead lists, identify lead-source metadata, track list IDs,
 * potentially sync lead counts. Credentials come only from
 * SCOUT_DATA_API_KEY, never hardcoded.
 */
export class ScoutDataProvider implements IntegrationProvider {
  readonly name = "SCOUT_DATA" as const;

  isConfigured(): boolean {
    return Boolean(process.env.SCOUT_DATA_API_KEY);
  }

  async getStatus(): Promise<IntegrationStatus> {
    const config = await prisma.integrationConfig.findUnique({ where: { provider: this.name } });
    return config?.status ?? "NOT_CONNECTED";
  }

  async connect(): Promise<void> {
    throw new Error("Scout Data integration is not implemented yet.");
  }

  async sync(_jobType: IntegrationJobType): Promise<void> {
    throw new Error("Scout Data integration is not implemented yet.");
  }
}
