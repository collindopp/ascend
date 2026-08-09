import { requireUser } from "@/lib/auth/dal";
import { getSessionHistoryForSetter } from "@/lib/sessions/queries";
import { SessionHistoryList } from "@/components/setter/SessionHistoryList";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function HistoryPage() {
  const user = await requireUser();
  const sessions = await getSessionHistoryForSetter(user.id);

  return (
    <div>
      <div className="animate-fade-in-up">
        <h1 className="text-lg font-semibold text-text-primary">History</h1>
        <p className="mt-1 text-sm text-text-tertiary">Your previous calling sessions.</p>
      </div>
      <div className="mt-6 animate-fade-in-up" style={{ animationDelay: "60ms" }}>
        {sessions.length === 0 ? (
          <EmptyState
            title="No calling sessions"
            description="Your calling history will appear here once you complete your first session."
          />
        ) : (
          <SessionHistoryList
            sessions={sessions.map((s) => ({
              id: s.id,
              leadListName: s.leadList.name,
              startedAt: s.startedAt,
              endedAt: s.endedAt,
              conversations: s.conversations,
              appointments: s.appointments,
              dq: s.dq,
              wrongNumber: s.wrongNumber,
            }))}
          />
        )}
      </div>
    </div>
  );
}
