import { logout } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";

export function LogoutButton() {
  return (
    <form action={logout}>
      <Button type="submit" variant="ghost" size="sm">
        Log out
      </Button>
    </form>
  );
}
