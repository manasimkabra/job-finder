"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { OpportunityCard } from "@/components/inbox/opportunity-card";
import { getOpportunity, scoreOpportunity } from "@/lib/discovery/engine";
import { currentProfile, useDashboard } from "@/lib/storage/dashboard-store";

export function OpportunityDetail({ id }: { id: string }) {
  const state = useDashboard();
  const opportunity = getOpportunity(id);
  if (!opportunity) notFound();
  const profile = currentProfile(state);
  const history = state.historyByProfile[profile.id]?.[id];
  const scored = scoreOpportunity(
    profile,
    opportunity,
    state.scoresByProfile[profile.id] ?? {},
  );

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <Link
        href="/"
        className="text-sm font-medium text-muted-foreground underline-offset-4 hover:underline"
      >
        Back to recommendations
      </Link>
      <div className="mt-6">
        <OpportunityCard
          opportunity={scored.opportunity}
          score={scored.score}
          priority={scored.priority}
          history={history}
          profileId={profile.id}
          detailed
        />
      </div>
    </div>
  );
}
