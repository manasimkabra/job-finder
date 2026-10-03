"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  const pathname = usePathname();
  const missingRole =
    pathname.startsWith("/jobs/") || pathname.startsWith("/opportunities/");

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-16 sm:px-6">
      <h1 className="font-heading text-4xl font-medium tracking-tight">
        {missingRole
          ? "This role is not on the board"
          : "That page is not part of Job Finder"}
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {missingRole
          ? "The listing may have been removed, or the link is mistyped. Search the board for a current role."
          : "The address does not match a recommendation or an opportunity."}
      </p>
      <Link href="/" className={`${buttonVariants()} mt-6`}>
        Back to recommendations
      </Link>
    </div>
  );
}
