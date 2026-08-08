import "server-only";
import { prisma } from "@/lib/db/client";
import type { IntegrationProvider } from "@/lib/integrations/types";
import type { IntegrationStatus, IntegrationJobType } from "@/lib/generated/prisma/enums";

/**
 * Stub provider — no live 2X Connect API calls. Future use per section 23:
 * dial volume, call outcomes, conversation data, potentially automating
 * metric collection. Credentials come only from TWO_X_CONNECT_API_KEY,
 * never hardcoded.
 */
export class TwoXConnectProvider implements IntegrationProvider {
  readonly name = "TWO_X_CONNECT" as const;

  isConfigured(): boolean {
    return Boolean(process.env.TWO_X_CONNECT_API_KEY);
  }

  async getStatus(): Promise<IntegrationStatus> {
    const config = await prisma.integrationConfig.findUnique({ where: { provider: this.name } });
    return config?.status ?? "NOT_CONNECTED";
  }

  async connect(): Promise<void> {
    throw new Error("2X Connect integration is not implemented yet.");
  }

  async sync(_jobType: IntegrationJobType): Promise<void> {
    throw new Error("2X Connect integration is not implemented yet.");
  }
}
