"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { arrangementLabel, employmentLabel, money } from "@/lib/domain/format";
import { LOCATION_OPTIONS } from "@/lib/domain/locations";
import {
  EMPLOYMENT_TYPES,
  WORK_ARRANGEMENTS,
  type EmploymentType,
  type Profile,
  type WorkArrangement,
} from "@/lib/domain/types";
import { deleteProfile, updateProfile } from "@/lib/storage/dashboard-store";
import { cn } from "@/lib/utils";

function toggle<T extends string>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

export function ProfileEditor({
  profile,
  canDelete,
  onClose,
}: {
  profile: Profile;
  canDelete: boolean;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(profile);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function save() {
    if (!draft.name.trim()) {
      setError("Add a name.");
      return;
    }
    if (!draft.resumeText.trim()) {
      setError("Paste a resume so seniority and fit can be inferred.");
      return;
    }
    updateProfile({
      ...draft,
      name: draft.name.trim(),
      preferences: {
        ...draft.preferences,
        minSalary: Number.isFinite(draft.preferences.minSalary)
          ? draft.preferences.minSalary
          : 0,
      },
    });
    onClose();
  }

  return (
    <form
      className="rounded-xl border bg-card p-4 sm:p-5"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-heading text-2xl font-medium">Edit profile</h2>
        <Button type="button" variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
      <div className="mt-4 grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="profile-name">Name</Label>
          <Input
            id="profile-name"
            value={draft.name}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="resume">Resume</Label>
          <textarea
            id="resume"
            value={draft.resumeText}
            onChange={(event) => setDraft({ ...draft, resumeText: event.target.value })}
            className="border-input bg-background min-h-40 w-full rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="interests">Career interests</Label>
          <textarea
            id="interests"
            value={draft.careerInterests}
            onChange={(event) =>
              setDraft({ ...draft, careerInterests: event.target.value })
            }
            className="border-input bg-background min-h-24 w-full rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
        <fieldset>
          <legend className="text-sm font-medium">Preferred locations</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {LOCATION_OPTIONS.map((option) => {
              const on = draft.preferences.locations.includes(option.id);
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
                    setDraft({
                      ...draft,
                      preferences: {
                        ...draft.preferences,
                        locations: toggle(draft.preferences.locations, option.id),
                      },
                    })
                  }
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-1.5">
            <Label htmlFor="profile-salary">Minimum salary</Label>
            <Input
              id="profile-salary"
              inputMode="numeric"
              value={draft.preferences.minSalary}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  preferences: {
                    ...draft.preferences,
                    minSalary: Number(event.target.value.replace(/[^0-9]/g, "") || 0),
                  },
                })
              }
            />
            <p className="text-xs text-muted-foreground">{money(draft.preferences.minSalary)}</p>
          </div>
          <fieldset>
            <legend className="text-sm font-medium">Work arrangement</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {WORK_ARRANGEMENTS.map((value) => {
                const on = draft.preferences.workArrangements.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={on}
                    className={cn(
                      "rounded-full border px-3 py-1 text-sm",
                      on ? "border-primary bg-primary text-primary-foreground" : "border-border",
                    )}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        preferences: {
                          ...draft.preferences,
                          workArrangements: toggle(
                            draft.preferences.workArrangements,
                            value as WorkArrangement,
                          ),
                        },
                      })
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
                const on = draft.preferences.employmentTypes.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={on}
                    className={cn(
                      "rounded-full border px-3 py-1 text-sm",
                      on ? "border-primary bg-primary text-primary-foreground" : "border-border",
                    )}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        preferences: {
                          ...draft.preferences,
                          employmentTypes: toggle(
                            draft.preferences.employmentTypes,
                            value as EmploymentType,
                          ),
                        },
                      })
                    }
                  >
                    {employmentLabel(value)}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>
      </div>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="submit">Save profile</Button>
        {canDelete ? (
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              if (!confirmDelete) {
                setConfirmDelete(true);
                return;
              }
              deleteProfile(profile.id);
              onClose();
            }}
          >
            {confirmDelete ? "Confirm delete" : "Delete profile"}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
