import { getLeadListsForAdmin, getAssignableSetters } from "@/lib/admin/queries";
import { AddLeadListModal } from "@/components/admin/AddLeadListModal";
import { LeadListStatusToggle } from "@/components/admin/LeadListStatusToggle";
import { AssignSettersModal } from "@/components/admin/AssignSettersModal";
import { Table, TableHead, TableHeadCell, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { formatInt } from "@/lib/format/number";

export default async function LeadListsPage() {
  const [leadLists, setters] = await Promise.all([getLeadListsForAdmin(), getAssignableSetters()]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Lead Lists</h1>
          <p className="mt-1 text-sm text-text-tertiary">
            {leadLists.length} lists. Only assigned reps can call a list; managers see every list&rsquo;s data
            regardless.
          </p>
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
            <TableHeadCell>Assigned</TableHeadCell>
            <TableHeadCell>Status</TableHeadCell>
            <TableHeadCell className="text-right">Actions</TableHeadCell>
          </tr>
        </TableHead>
        <TableBody>
          {leadLists.map((list) => {
            const assignedIds = list.assignments.map((a) => a.setterId);
            return (
              <TableRow key={list.id}>
                <TableCell className="font-medium text-text-primary">{list.name}</TableCell>
                <TableCell className="text-text-secondary">{list.source}</TableCell>
                <TableCell className="text-text-secondary">{list.location ?? "—"}</TableCell>
                <TableCell numeric>{list.leadCount !== null ? formatInt(list.leadCount) : "—"}</TableCell>
                <TableCell numeric>{formatInt(list._count.callingSessions)}</TableCell>
                <TableCell>
                  {assignedIds.length === 0 ? (
                    <Badge tone="warning">Nobody</Badge>
                  ) : (
                    <span className="text-text-secondary">
                      {assignedIds.length === setters.length
                        ? "All reps"
                        : `${formatInt(assignedIds.length)} of ${formatInt(setters.length)}`}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge tone={list.status === "ACTIVE" ? "positive" : "neutral"}>{list.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <AssignSettersModal
                      leadListId={list.id}
                      leadListName={list.name}
                      setters={setters}
                      assignedSetterIds={assignedIds}
                    />
                    <LeadListStatusToggle leadListId={list.id} status={list.status} />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
