import { getLeadListsForAdmin } from "@/lib/admin/queries";
import { AddLeadListModal } from "@/components/admin/AddLeadListModal";
import { LeadListStatusToggle } from "@/components/admin/LeadListStatusToggle";
import { Table, TableHead, TableHeadCell, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { formatInt } from "@/lib/format/number";

export default async function LeadListsPage() {
  const leadLists = await getLeadListsForAdmin();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Lead Lists</h1>
          <p className="mt-1 text-sm text-text-tertiary">{leadLists.length} lists.</p>
        </div>
        <AddLeadListModal />
      </div>

      <Table>
        <TableHead>
          <tr>
            <TableHeadCell>Name</TableHeadCell>
            <TableHeadCell>Source</TableHeadCell>
            <TableHeadCell>Location</TableHeadCell>
            <TableHeadCell numeric>Leads</TableHeadCell>
            <TableHeadCell numeric>Sessions</TableHeadCell>
            <TableHeadCell>Status</TableHeadCell>
            <TableHeadCell className="text-right">Actions</TableHeadCell>
          </tr>
        </TableHead>
        <TableBody>
          {leadLists.map((list) => (
            <TableRow key={list.id}>
              <TableCell className="font-medium text-text-primary">{list.name}</TableCell>
              <TableCell className="text-text-secondary">{list.source}</TableCell>
              <TableCell className="text-text-secondary">{list.location ?? "—"}</TableCell>
              <TableCell numeric>{list.leadCount !== null ? formatInt(list.leadCount) : "—"}</TableCell>
              <TableCell numeric>{formatInt(list._count.callingSessions)}</TableCell>
              <TableCell>
                <Badge tone={list.status === "ACTIVE" ? "positive" : "neutral"}>{list.status}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <LeadListStatusToggle leadListId={list.id} status={list.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
