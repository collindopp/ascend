import type { IntegrationProviderName, IntegrationStatus, IntegrationJobType } from "@/lib/generated/prisma/enums";

/**
 * The core app depends only on this interface, never on a concrete provider
 * (dependency inversion — section 23/60 of the ASCEND spec). Nothing here
 * is wired to a real external API yet; every method either reads local DB
 * state or throws NotImplemented. ASCEND must function identically with
 * zero integrations connected.
 */
export interface IntegrationProvider {
  readonly name: IntegrationProviderName;

  /** Whether this provider has the environment variables it would need to operate. */
  isConfigured(): boolean;

  /** Current connection status, derived from real state — never hardcoded to CONNECTED. */
  getStatus(): Promise<IntegrationStatus>;

  /** Attempts to establish a connection using configured credentials. Throws until implemented. */
  connect(): Promise<void>;

  /** Runs one sync job of the given type. Throws until implemented. */
  sync(jobType: IntegrationJobType): Promise<void>;
}

export interface JobQueue {
  enqueue(provider: IntegrationProviderName, type: IntegrationJobType): Promise<{ jobId: string }>;
  markRunning(jobId: string): Promise<void>;
  markSuccess(jobId: string): Promise<void>;
  markFailed(jobId: string, error: string): Promise<void>;
}
