import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { roleHomePath } from "@/lib/auth/roles";

export default async function RootPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  redirect(roleHomePath(session.user.role));
}
