"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LOCATION_OPTIONS } from "@/lib/domain/locations";
import { POSTED_WITHIN_OPTIONS } from "@/lib/domain/time";
import {
  BATCH_SIZES,
  EMPLOYMENT_TYPES,
  WORK_ARRANGEMENTS,
  type BatchSize,
  type EmploymentType,
  type PostedWithin,
  type Profile,
  type SearchCriteria,
  type SearchRun,
  type SeniorityOverride,
} from "@/lib/domain/types";
import { arrangementLabel, employmentLabel, money } from "@/lib/domain/format";
import { criteriaFromProfile } from "@/lib/storage/dashboard-store";
import { cn } from "@/lib/utils";

function toggle<T extends string>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

export function FilterBar({
  profile,
  run,
  onFindJobs,
  onFindMore,
  onRefresh,
}: {
  profile: Profile;
  run: SearchRun | null;
  onFindJobs: (criteria: SearchCriteria) => void;
  onFindMore: () => void;
  onRefresh: () => void;
}) {
  const [draft, setDraft] = useState<SearchCriteria>(() => criteriaFromProfile(profile));
  const filtersChanged =
    run != null && JSON.stringify(run.criteria) !== JSON.stringify(draft);
  const locationSummary =
    draft.locations.length === 0
      ? "Any location"
      : draft.locations.map((id) => LOCATION_OPTIONS.find((option) => option.id === id)?.label ?? id).join(", ");

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="grid gap-1.5">
          <Label htmlFor="posted-within">Posted within</Label>
          <select
            id="posted-within"
            className="border-input bg-background h-10 rounded-lg border px-3 text-sm"
            value={draft.postedWithin}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                postedWithin: event.target.value as PostedWithin,
              }))
            }
          >
            {POSTED_WITHIN_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" className="h-10 px-4" onClick={() => onFindJobs(draft)}>
            Find jobs
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-10 px-4"
            disabled={!run || run.exhausted}
            onClick={onFindMore}
          >
            Find more
          </Button>
          <Button type="button" variant="secondary" className="h-10 px-4" onClick={onRefresh}>
            Refresh new
          </Button>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        {locationSummary}
        {draft.workArrangements.length > 0
          ? ` · ${draft.workArrangements.map(arrangementLabel).join(", ")}`
          : ""}
        {draft.employmentTypes.length > 0
          ? ` · ${draft.employmentTypes.map(employmentLabel).join(", ")}`
          : ""}
        {draft.minSalary ? ` · from ${money(draft.minSalary)}` : ""}
        {` · ${draft.batchSize} per batch`}
      </p>
      {filtersChanged ? (
        <p className="mt-1 text-sm text-muted-foreground">
          Filters changed. Find jobs searches again. Find more keeps the last search.
        </p>
      ) : null}
      <details className="mt-3">
        <summary className="cursor-pointer text-sm font-medium">Advanced filters</summary>
        <div className="mt-4 grid gap-4">
          <fieldset>
            <legend className="text-sm font-medium">Locations</legend>
            <p className="mt-1 text-xs text-muted-foreground">
              Select any combination. Anywhere in United States does not let a city pick narrow results. Remote - US is a place, separate from Remote as a work arrangement.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {LOCATION_OPTIONS.map((option) => {
                const on = draft.locations.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={on}
                    className={cn(
                      "rounded-full border px-3 py-1 text-sm",
                      on
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background",
                    )}
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        locations: toggle(current.locations, option.id),
                      }))
                    }
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-sm font-medium">Work arrangement</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {WORK_ARRANGEMENTS.map((value) => {
                const on = draft.workArrangements.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={on}
                    className={cn(
                      "rounded-full border px-3 py-1 text-sm",
                      on
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background",
                    )}
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        workArrangements: toggle(current.workArrangements, value),
                      }))
                    }
                  >
                    {arrangementLabel(value)}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-sm font-medium">Employment type</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {EMPLOYMENT_TYPES.map((value) => {
                const on = draft.employmentTypes.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={on}
                    className={cn(
                      "rounded-full border px-3 py-1 text-sm",
                      on
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background",
                    )}
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        employmentTypes: toggle(current.employmentTypes, value as EmploymentType),
                      }))
                    }
                  >
                    {employmentLabel(value)}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="grid gap-1.5">
              <Label htmlFor="min-salary">Minimum salary</Label>
              <Input
                id="min-salary"
                inputMode="numeric"
                value={draft.minSalary ?? ""}
                onChange={(event) => {
                  const raw = event.target.value.replace(/[^0-9]/g, "");
                  setDraft((current) => ({
                    ...current,
                    minSalary: raw ? Number(raw) : null,
                  }));
                }}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="batch-size">Results per batch</Label>
              <select
                id="batch-size"
                className="border-input bg-background h-10 rounded-lg border px-3 text-sm"
                value={String(draft.batchSize)}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    batchSize: Number(event.target.value) as BatchSize,
                  }))
                }
              >
                {BATCH_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="keyword">Keyword (optional)</Label>
              <Input
                id="keyword"
                value={draft.keyword}
                placeholder="Not required"
                onChange={(event) =>
                  setDraft((current) => ({ ...current, keyword: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="seniority-override">Seniority override</Label>
              <select
                id="seniority-override"
                className="border-input bg-background h-10 rounded-lg border px-3 text-sm"
                value={draft.seniorityOverride}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    seniorityOverride: event.target.value as SeniorityOverride,
                  }))
                }
              >
                <option value="resume">Resume-based (default)</option>
                <option value="strong-and-stretch">Only strong fit and stretch</option>
                <option value="strong-only">Only strong fit</option>
              </select>
            </div>
          </div>
        </div>
      </details>
    </div>
  );
}
