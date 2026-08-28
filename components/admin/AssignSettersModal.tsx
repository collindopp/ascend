"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/Toast";
import { setLeadListAssignmentsAction } from "@/lib/admin/actions";

interface SetterOption {
  id: string;
  name: string;
}

interface AssignSettersModalProps {
  leadListId: string;
  leadListName: string;
  setters: SetterOption[];
  assignedSetterIds: string[];
}

export function AssignSettersModal({
  leadListId,
  leadListName,
  setters,
  assignedSetterIds,
}: AssignSettersModalProps) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(assignedSetterIds);
  const [isPending, startTransition] = useTransition();

  function openModal() {
    // Re-seed from the server's current state each time, so reopening after a
    // cancel doesn't carry over abandoned edits.
    setSelected(assignedSetterIds);
    setOpen(true);
  }

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  function handleSave() {
    startTransition(async () => {
      const result = await setLeadListAssignmentsAction({ leadListId, setterIds: selected });
      if (!result.ok) {
        toast.push({ title: "Couldn't save assignments", description: result.error, tone: "error" });
        return;
      }
      toast.push({
        title: selected.length === 0 ? "List assigned to nobody" : `Assigned to ${selected.length} rep${selected.length === 1 ? "" : "s"}`,
        description: leadListName,
        tone: "success",
      });
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={openModal}>
        Assign
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Assign reps"
        description={`Only the reps you pick can call ${leadListName}. Managers still see all of its data.`}
      >
        <div className="flex flex-col gap-3">
          {setters.length === 0 ? (
            <p className="py-4 text-center text-sm text-text-tertiary">No active setters to assign.</p>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-tertiary">
                  {selected.length} of {setters.length} selected
                </span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelected(setters.map((s) => s.id))}
                    className="text-xs text-text-secondary transition-colors hover:text-text-primary"
                  >
                    Select all
                  </button>
                  <span className="text-xs text-text-disabled">·</span>
                  <button
                    type="button"
                    onClick={() => setSelected([])}
                    className="text-xs text-text-secondary transition-colors hover:text-text-primary"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="flex max-h-72 flex-col divide-y divide-border-subtle overflow-y-auto rounded-[var(--radius-sm)] border border-border">
                {setters.map((setter) => {
                  const checked = selected.includes(setter.id);
                  return (
                    <label
                      key={setter.id}
                      className="flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors hover:bg-surface-2/60"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(setter.id)}
                        className="h-4 w-4 shrink-0 accent-[var(--accent)]"
                      />
                      <Avatar name={setter.name} size="sm" />
                      <span className="text-sm text-text-primary">{setter.name}</span>
                    </label>
                  );
                })}
              </div>

              {selected.length === 0 && (
                <p className="text-xs text-warning">
                  With nobody assigned, no rep will be able to call this list.
                </p>
              )}
            </>
          )}

          <div className="mt-1 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isPending}>
              {isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
