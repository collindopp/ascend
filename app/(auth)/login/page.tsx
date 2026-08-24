import { LoginForm } from "@/components/auth/LoginForm";
import { Logo } from "@/components/ui/Logo";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex flex-col items-center text-center">
          <Logo className="h-6 w-auto text-text-primary" />
          <p className="mt-3 text-sm text-text-tertiary">Setter performance & lead intelligence</p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-border bg-gradient-to-b from-surface-2/40 to-surface-1 p-6 shadow-[var(--shadow-elevated)]">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
