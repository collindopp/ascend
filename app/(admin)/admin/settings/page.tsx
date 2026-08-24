import { getSystemSettings } from "@/lib/admin/queries";
import { AddSettingForm } from "@/components/admin/AddSettingForm";
import { Table, TableHead, TableHeadCell, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { LocalDateTime } from "@/components/ui/LocalDateTime";

export default async function SettingsPage() {
  const settings = await getSystemSettings();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-text-primary">Settings</h1>
        <p className="mt-1 text-sm text-text-tertiary">System-wide configuration values.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add or update a setting</CardTitle>
        </CardHeader>
        <CardContent>
          <AddSettingForm />
        </CardContent>
      </Card>

      {settings.length === 0 ? (
        <EmptyState title="No settings configured" description="Add one above — it'll appear here." />
      ) : (
        <Table>
          <TableHead>
            <tr>
              <TableHeadCell>Key</TableHeadCell>
              <TableHeadCell>Value</TableHeadCell>
              <TableHeadCell>Updated</TableHeadCell>
            </tr>
          </TableHead>
          <TableBody>
            {settings.map((setting) => (
              <TableRow key={setting.id}>
                <TableCell className="font-mono text-text-primary">{setting.key}</TableCell>
                <TableCell className="text-text-secondary">{String(setting.value)}</TableCell>
                <TableCell className="text-text-tertiary">
                  <LocalDateTime iso={setting.updatedAt.toISOString()} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
