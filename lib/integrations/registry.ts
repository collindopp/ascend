import "server-only";
import type { IntegrationProvider } from "@/lib/integrations/types";
import type { IntegrationProviderName } from "@/lib/generated/prisma/enums";
import { QuickbaseProvider } from "@/lib/integrations/providers/quickbase";
import { ScoutDataProvider } from "@/lib/integrations/providers/scout-data";
import { TwoXConnectProvider } from "@/lib/integrations/providers/two-x-connect";

/**
 * The only place the core app is allowed to know concrete provider classes
 * exist. Every caller elsewhere should go through getProvider() /
 * getAllProviders() and code against the IntegrationProvider interface —
 * this is what keeps the core system independent of any one integration
 * (section 23: "The core application must NOT depend directly on these
 * providers").
 */
const registry: Record<IntegrationProviderName, IntegrationProvider> = {
  QUICKBASE: new QuickbaseProvider(),
  SCOUT_DATA: new ScoutDataProvider(),
  TWO_X_CONNECT: new TwoXConnectProvider(),
};

export function getProvider(name: IntegrationProviderName): IntegrationProvider {
  return registry[name];
}

export function getAllProviders(): IntegrationProvider[] {
  return Object.values(registry);
}
