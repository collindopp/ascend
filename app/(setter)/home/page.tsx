import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/dal";
import { getActiveSessionForSetter } from "@/lib/sessions/queries";
import { getActiveLeadListsWithStats } from "@/lib/lead-lists/queries";
import { getMorningBrief } from "@/lib/sessions/morning-brief";
import { MorningBrief } from "@/components/setter/MorningBrief";
import { LeadListSelector } from "@/components/setter/LeadListSelector";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function HomePage() {
  const user = await requireUser();

  const activeSession = await getActiveSessionForSetter(user.id);
  if (activeSession) {
    redirect(`/session/${activeSession.id}`);
  }

  const [leadLists, brief] = await Promise.all([
    getActiveLeadListsWithStats(user),
    getMorningBrief(user.id),
  ]);

  return (
    <div>
      <div className="animate-fade-in-up">
        <MorningBrief brief={brief} compact />
      </div>

      <div className="mt-8 animate-fade-in-up" style={{ animationDelay: "60ms" }}>
        <h1 className="text-lg font-semibold text-text-primary">Select a lead list</h1>
        <p className="mt-1 text-sm text-text-tertiary">
          Choose what you&rsquo;re calling today. You can&rsquo;t switch lists mid-session.
        </p>
      </div>
      <div className="mt-6">
        {leadLists.length === 0 ? (
          // A setter seeing nothing almost always means "assigned nothing yet"
          // rather than "none exist", so point them at the actual fix.
          <EmptyState
            title={user.role === "SETTER" ? "No lead lists assigned to you" : "No lead lists available"}
            description={
              user.role === "SETTER"
                ? "Ask your manager to assign you a lead list before you can start calling."
                : "Add an active lead list before you can start calling."
            }
          />
        ) : (
          <LeadListSelector leadLists={leadLists} />
        )}
      </div>
    </div>
  );
}
