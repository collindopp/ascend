"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { updateUserAction } from "@/lib/admin/actions";
import type { Role } from "@/lib/generated/prisma/enums";

export function UserRowActions({ userId, role, active, isSelf }: { userId: string; role: Role; active: boolean; isSelf: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  function handleRoleChange(newRole: string) {
    startTransition(async () => {
      const result = await updateUserAction({ userId, role: newRole });
      if (!result.ok) {
        toast.push({ title: "Couldn't update role", description: result.error, tone: "error" });
        return;
      }
      router.refresh();
    });
  }

  function handleToggleActive() {
    startTransition(async () => {
      const result = await updateUserAction({ userId, active: !active });
      if (!result.ok) {
        toast.push({ title: "Couldn't update user", description: result.error, tone: "error" });
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Select value={role} onChange={(e) => handleRoleChange(e.target.value)} disabled={isPending || isSelf}>
        <option value="SETTER">Setter</option>
        <option value="MANAGER">Manager</option>
        <option value="ADMIN">Admin</option>
      </Select>
      <Button variant="ghost" size="sm" onClick={handleToggleActive} disabled={isPending || isSelf}>
        {active ? "Deactivate" : "Activate"}
      </Button>
    </div>
  );
}
