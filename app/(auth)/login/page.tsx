import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold tracking-[0.3em] text-text-primary">ASCEND</p>
          <p className="mt-2 text-sm text-text-tertiary">Setter performance & lead intelligence</p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface-1 p-6">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
