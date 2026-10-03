"use client";

import { useState } from "react";
import { FilterBar } from "@/components/inbox/filter-bar";
import { OpportunityCard } from "@/components/inbox/opportunity-card";
import { ProfileEditor } from "@/components/inbox/profile-editor";
import { Button } from "@/components/ui/button";
import { VIEW_LABELS, viewMatches } from "@/lib/domain/format";
import { inferCandidateSeniority } from "@/lib/domain/seniority";
import type { InboxView } from "@/lib/domain/types";
import { getOpportunity, scoreOpportunity } from "@/lib/discovery/engine";
import {
  addProfile,
  currentProfile,
  findJobs,
  findMore,
  refreshNew,
  resetStorage,
  selectProfile,
  useDashboard,
} from "@/lib/storage/dashboard-store";
import { cn } from "@/lib/utils";

export function Dashboard() {
  const state = useDashboard();
  const profile = currentProfile(state);
  const seniority = inferCandidateSeniority(profile);
  const [view, setView] = useState<InboxView>("recommendations");
  const [editing, setEditing] = useState(false);
  const history = state.historyByProfile[profile.id] ?? {};
  const scores = state.scoresByProfile[profile.id] ?? {};
  const run = state.searchRunByProfile[profile.id] ?? null;

  const feedIds = run?.feedIds ?? [];
  const sourceItems =
    view === "recommendations"
      ? feedIds
          .map((id) => history[id])
          .filter((item) => item != null && item.status === "shown")
      : Object.values(history).filter((item) => viewMatches(view, item.status));
  const cards = sourceItems
    .map((item) => {
      const opportunity = getOpportunity(item.opportunityId);
      if (!opportunity) return null;
      const scored = scoreOpportunity(profile, opportunity, scores);
      return { ...scored, history: item };
    })
    .filter((item) => item != null)
    .sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return b.opportunity.postedAt.localeCompare(a.opportunity.postedAt);
    });

  if (state.storageError) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16">
        <h1 className="font-heading text-4xl font-medium">Saved data could not be read</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{state.storageError}</p>
        <Button type="button" className="mt-4" onClick={() => resetStorage()}>
          Reset this browser
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="font-heading text-4xl font-medium tracking-tight sm:text-5xl">
            Opportunities for {profile.name}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Ranked from the resume and interests, on responsibilities and requirements.
            {" "}
            {seniority.label}.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="grid gap-1 text-sm">
            Profile
            <select
              id="profile"
              className="border-input bg-background h-10 min-w-48 rounded-lg border px-3"
              value={profile.id}
              onChange={(event) => {
                setEditing(false);
                setView("recommendations");
                selectProfile(event.target.value);
              }}
            >
              {state.profiles.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => addProfile()}>
              Add profile
            </Button>
            <Button type="button" variant="outline" onClick={() => setEditing((open) => !open)}>
              Edit profile
            </Button>
          </div>
        </div>
      </div>

      {editing ? (
        <div className="mt-4">
          <ProfileEditor
            key={profile.id}
            profile={profile}
            canDelete={state.profiles.length > 1}
            onClose={() => setEditing(false)}
          />
        </div>
      ) : null}

      <div className="mt-4">
        <FilterBar
          key={profile.id}
          profile={profile}
          run={run}
          onFindJobs={(criteria) => findJobs(profile.id, criteria)}
          onFindMore={() => findMore(profile.id)}
          onRefresh={() => refreshNew(profile.id)}
        />
      </div>
      {state.notice ? (
        <p className="mt-3 text-sm" role="status">
          {state.notice}
        </p>
      ) : null}

      <div className="mt-6 flex gap-1 overflow-x-auto border-b pb-px" role="tablist" aria-label="Inbox">
        {VIEW_LABELS.map((item) => {
          const count =
            item.id === "recommendations"
              ? feedIds.filter((id) => history[id]?.status === "shown").length
              : Object.values(history).filter((entry) => viewMatches(item.id, entry.status))
                  .length;
          const selected = view === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              className={cn(
                "shrink-0 rounded-t-lg px-3 py-2 text-sm",
                selected
                  ? "bg-card font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setView(item.id)}
            >
              {item.label}
              <span className="ml-1 text-xs text-muted-foreground">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid gap-3" id="results">
        {view === "recommendations" ? (
          <div>
            <h2 className="font-heading text-2xl font-medium tracking-tight">
              Recommended Opportunities
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Review this batch, then apply, save, or skip. Find more loads the next unseen matches.
            </p>
          </div>
        ) : null}
        {cards.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card px-5 py-10 text-center">
            <h2 className="font-heading text-2xl font-medium">
              {view === "recommendations" ? "No recommendations loaded" : "Nothing in this view"}
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
              {view === "recommendations"
                ? "Click Find Jobs to load the highest-ranked unseen opportunities for this profile."
                : "Save, mark applied, or skip from a recommendation to file it here for this profile only."}
            </p>
          </div>
        ) : (
          cards.map((card, index) => (
            <OpportunityCard
              key={card.opportunity.id}
              opportunity={card.opportunity}
              score={card.score}
              priority={card.priority}
              rank={index + 1}
              history={card.history}
              profileId={profile.id}
            />
          ))
        )}
      </div>
    </div>
  );
}
