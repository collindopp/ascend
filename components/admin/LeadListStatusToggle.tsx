"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { updateLeadListStatusAction } from "@/lib/admin/actions";
import type { LeadListStatus } from "@/lib/generated/prisma/enums";

export function LeadListStatusToggle({ leadListId, status }: { leadListId: string; status: LeadListStatus }) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const nextStatus = status === "ACTIVE" ? "ARCHIVED" : "ACTIVE";
    startTransition(async () => {
      const result = await updateLeadListStatusAction({ leadListId, status: nextStatus });
      if (!result.ok) {
        toast.push({ title: "Couldn't update status", description: result.error, tone: "error" });
        return;
      }
      router.refresh();
    });
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleToggle} disabled={isPending}>
      {status === "ACTIVE" ? "Archive" : "Reactivate"}
    </Button>
  );
}
