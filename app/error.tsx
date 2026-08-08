"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Full detail stays server-side in the terminal/log stream; the client only ever sees a generic message.
    console.error("Unhandled route error", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-sm font-medium text-text-primary">Something went wrong</p>
      <p className="max-w-sm text-sm text-text-tertiary">
        We hit a problem loading this page. It&rsquo;s been logged — try again in a moment.
      </p>
      <Button variant="secondary" size="sm" onClick={reset} className="mt-2">
        Retry
      </Button>
    </div>
  );
}
