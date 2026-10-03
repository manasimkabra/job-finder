"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-lg px-4 py-16 sm:px-6">
      <h1 className="font-heading text-4xl font-medium tracking-tight">
        This page did not load
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Job Finder hit a problem reading this view. Try again, or go back to
        recommendations.
      </p>
      {error.digest ? (
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          Reference {error.digest}
        </p>
      ) : null}
      <div className="mt-6 flex flex-wrap gap-3">
        <Button type="button" onClick={reset}>
          Try again
        </Button>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Back to recommendations
        </Link>
      </div>
    </div>
  );
}
