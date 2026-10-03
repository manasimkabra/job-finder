import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="h-1 bg-primary" />
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="min-w-0">
          <span className="font-heading text-xl font-medium tracking-tight">Job Finder</span>
          <span className="mt-0.5 hidden text-sm text-muted-foreground sm:block">
            Ranked roles and hiring posts for the profile you pick
          </span>
        </Link>
      </div>
    </header>
  );
}
