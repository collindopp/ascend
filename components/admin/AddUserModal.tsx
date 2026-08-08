"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { createUserAction } from "@/lib/admin/actions";

interface TeamOption {
  id: string;
  name: string;
}

export function AddUserModal({ teams }: { teams: TeamOption[] }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createUserAction({
        name: formData.get("name"),
        email: formData.get("email"),
        password: formData.get("password"),
        role: formData.get("role"),
        teamId: formData.get("teamId") || null,
      });
      if (!result.ok) {
        toast.push({ title: "Couldn't create user", description: result.error, tone: "error" });
        return;
      }
      toast.push({ title: "User created", tone: "success" });
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        Add user
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Add user" description="Creates an account with an initial password.">
        <form action={handleSubmit} className="flex flex-col gap-3">
          <input
            name="name"
            required
            placeholder="Full name"
            className="h-10 rounded-[var(--radius-sm)] border border-border-strong bg-surface-2 px-3 text-sm text-text-primary placeholder:text-text-tertiary"
          />
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            className="h-10 rounded-[var(--radius-sm)] border border-border-strong bg-surface-2 px-3 text-sm text-text-primary placeholder:text-text-tertiary"
          />
          <input
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="Initial password (min 8 chars)"
            className="h-10 rounded-[var(--radius-sm)] border border-border-strong bg-surface-2 px-3 text-sm text-text-primary placeholder:text-text-tertiary"
          />
          <Select name="role" defaultValue="SETTER" className="w-full">
            <option value="SETTER">Setter</option>
            <option value="MANAGER">Manager</option>
            <option value="ADMIN">Admin</option>
          </Select>
          <Select name="teamId" defaultValue="" className="w-full">
            <option value="">No team</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Creating…" : "Create user"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
