import { getIntegrationStatuses } from "@/lib/admin/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const PROVIDER_META: Record<string, { label: string; description: string }> = {
  QUICKBASE: {
    label: "Quickbase",
    description: "Push performance data, pull lead information, sync appointment outcomes.",
  },
  SCOUT_DATA: {
    label: "Scout Data",
    description: "Import lead lists, lead-source metadata, and list IDs.",
  },
  TWO_X_CONNECT: {
    label: "2X Connect",
    description: "Dial volume, call outcomes, and conversation data.",
  },
};

const STATUS_TONE = {
  NOT_CONNECTED: "neutral",
  CONNECTED: "positive",
  ERROR: "danger",
  SYNCING: "warning",
} as const;

export default async function IntegrationsPage() {
  const statuses = await getIntegrationStatuses();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-text-primary">Integrations</h1>
        <p className="mt-1 text-sm text-text-tertiary">
          Architecture is ready; nothing below is actually connected yet — statuses reflect the real, unconfigured state.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {statuses.map(({ provider, status, lastSyncAt }) => {
          const meta = PROVIDER_META[provider];
          return (
            <Card key={provider}>
              <CardHeader>
                <CardTitle>{meta.label}</CardTitle>
                <Badge tone={STATUS_TONE[status]}>{status.replace("_", " ")}</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-tertiary">{meta.description}</p>
                <p className="mt-4 text-xs text-text-tertiary">
                  {lastSyncAt ? `Last sync: ${lastSyncAt.toLocaleString()}` : "Ready for connection."}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
