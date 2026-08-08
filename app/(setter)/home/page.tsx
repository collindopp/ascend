import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/dal";
import { getActiveSessionForSetter } from "@/lib/sessions/queries";
import { getActiveLeadListsWithStats } from "@/lib/lead-lists/queries";
import { LeadListSelector } from "@/components/setter/LeadListSelector";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function HomePage() {
  const user = await requireUser();

  const activeSession = await getActiveSessionForSetter(user.id);
  if (activeSession) {
    redirect(`/session/${activeSession.id}`);
  }

  const leadLists = await getActiveLeadListsWithStats();

  return (
    <div>
      <h1 className="text-lg font-semibold text-text-primary">Select a lead list</h1>
      <p className="mt-1 text-sm text-text-tertiary">
        Choose what you&rsquo;re calling today. You can&rsquo;t switch lists mid-session.
      </p>
      <div className="mt-6">
        {leadLists.length === 0 ? (
          <EmptyState
            title="No lead lists available"
            description="Ask a manager or admin to add an active lead list before you can start calling."
          />
        ) : (
          <LeadListSelector leadLists={leadLists} />
        )}
      </div>
    </div>
  );
}
