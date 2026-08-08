import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/dal";
import { getSessionForSetter } from "@/lib/sessions/queries";
import { ActiveSessionView } from "@/components/setter/ActiveSessionView";
import { SessionSummary } from "@/components/setter/SessionSummary";

export default async function SessionPage({ params }: PageProps<"/session/[id]">) {
  const { id } = await params;
  const user = await requireUser();

  const session = await getSessionForSetter(id, user.id);
  if (!session) notFound();

  if (session.status === "ACTIVE") {
    return (
      <ActiveSessionView
        sessionId={session.id}
        leadListName={session.leadList.name}
        startedAt={session.startedAt.toISOString()}
        initialCounts={{ dials: session.dials, conversations: session.conversations, appointments: session.appointments }}
      />
    );
  }

  return (
    <SessionSummary
      leadListName={session.leadList.name}
      startedAt={session.startedAt}
      endedAt={session.endedAt ?? session.startedAt}
      dials={session.dials}
      conversations={session.conversations}
      appointments={session.appointments}
    />
  );
}
