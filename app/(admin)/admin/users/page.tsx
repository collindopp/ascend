import { requireUser } from "@/lib/auth/dal";
import { getUsersForAdmin, getTeamsForAdmin } from "@/lib/admin/queries";
import { AddUserModal } from "@/components/admin/AddUserModal";
import { UserRowActions } from "@/components/admin/UserRowActions";
import { Table, TableHead, TableHeadCell, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";

export default async function UsersPage() {
  const currentUser = await requireUser();
  const [users, teams] = await Promise.all([getUsersForAdmin(), getTeamsForAdmin()]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Users</h1>
          <p className="mt-1 text-sm text-text-tertiary">{users.length} accounts.</p>
        </div>
        <AddUserModal teams={teams} />
      </div>

      <Table>
        <TableHead>
          <tr>
            <TableHeadCell>Name</TableHeadCell>
            <TableHeadCell>Email</TableHeadCell>
            <TableHeadCell>Team</TableHeadCell>
            <TableHeadCell>Status</TableHeadCell>
            <TableHeadCell className="text-right">Role</TableHeadCell>
          </tr>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium text-text-primary">{user.name}</TableCell>
              <TableCell className="text-text-secondary">{user.email}</TableCell>
              <TableCell className="text-text-secondary">{user.team?.name ?? "—"}</TableCell>
              <TableCell>
                <Badge tone={user.active ? "positive" : "neutral"}>{user.active ? "Active" : "Inactive"}</Badge>
              </TableCell>
              <TableCell>
                <UserRowActions userId={user.id} role={user.role} active={user.active} isSelf={user.id === currentUser.id} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
