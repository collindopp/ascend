import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-sm font-medium text-text-primary">Page not found</p>
      <p className="max-w-sm text-sm text-text-tertiary">
        The page you&rsquo;re looking for doesn&rsquo;t exist or you don&rsquo;t have access to it.
      </p>
      <Link href="/">
        <Button variant="secondary" size="sm" className="mt-2">
          Go home
        </Button>
      </Link>
    </div>
  );
}
