"use client";

import { useSyncExternalStore } from "react";
import { seedProfiles } from "@/data/profiles";
import type {
  JobAction,
  JobScore,
  Profile,
  ProfileJobHistory,
  SearchCriteria,
  SearchRun,
} from "@/lib/domain/types";
import {
  MAX_INDEX_WAVE,
  newlyIndexed,
  unseenBatch,
} from "@/lib/discovery/engine";

const STORAGE_KEY = "job-finder:dashboard";

export type DashboardState = {
  profiles: Profile[];
  activeProfileId: string;
  historyByProfile: Record<string, Record<string, ProfileJobHistory>>;
  scoresByProfile: Record<string, Record<string, JobScore>>;
  indexCursor: number;
  searchRunByProfile: Record<string, SearchRun | null>;
  notice: string | null;
  storageError: string | null;
};

export function criteriaFromProfile(profile: Profile): SearchCriteria {
  return {
    postedWithin: "7d",
    locations: [...profile.preferences.locations],
    workArrangements: [...profile.preferences.workArrangements],
    minSalary: profile.preferences.minSalary,
    employmentTypes: [...profile.preferences.employmentTypes],
    batchSize: 25,
    keyword: "",
    seniorityOverride: "resume",
  };
}

function seedState(): DashboardState {
  return {
    profiles: seedProfiles,
    activeProfileId: seedProfiles[0].id,
    historyByProfile: {},
    scoresByProfile: {},
    indexCursor: 0,
    searchRunByProfile: {},
    notice: null,
    storageError: null,
  };
}

const SERVER_STATE: DashboardState = seedState();

let snapshot: DashboardState | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit() {
  for (const listener of listeners) listener();
}

function isProfile(value: unknown): value is Profile {
  if (!value || typeof value !== "object") return false;
  const profile = value as Profile;
  return (
    typeof profile.id === "string" &&
    typeof profile.name === "string" &&
    typeof profile.resumeText === "string" &&
    typeof profile.careerInterests === "string" &&
    typeof profile.version === "number" &&
    Array.isArray(profile.preferences?.locations)
  );
}

function readState(): DashboardState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedState();
    const parsed = JSON.parse(raw) as DashboardState;
    if (!Array.isArray(parsed.profiles) || parsed.profiles.some((profile) => !isProfile(profile))) {
      throw new Error("Profiles saved in this browser could not be read.");
    }
    if (parsed.profiles.length === 0) return seedState();
    const active = parsed.profiles.some((profile) => profile.id === parsed.activeProfileId)
      ? parsed.activeProfileId
      : parsed.profiles[0].id;
    return {
      profiles: parsed.profiles,
      activeProfileId: active,
      historyByProfile: parsed.historyByProfile ?? {},
      scoresByProfile: parsed.scoresByProfile ?? {},
      indexCursor: typeof parsed.indexCursor === "number" ? parsed.indexCursor : 0,
      searchRunByProfile: normalizeRuns(parsed.searchRunByProfile),
      notice: null,
      storageError: null,
    };
  } catch (error) {
    return {
      ...seedState(),
      storageError:
        error instanceof Error
          ? error.message
          : "Saved data in this browser could not be read.",
    };
  }
}

function normalizeRuns(
  runs: Record<string, SearchRun | null> | undefined,
): Record<string, SearchRun | null> {
  const next: Record<string, SearchRun | null> = {};
  for (const [id, run] of Object.entries(runs ?? {})) {
    if (!run) {
      next[id] = null;
      continue;
    }
    next[id] = {
      ...run,
      feedIds: Array.isArray(run.feedIds) ? run.feedIds : [],
    };
  }
  return next;
}

function getClientSnapshot(): DashboardState {
  if (!snapshot) snapshot = readState();
  return snapshot;
}

function commit(next: DashboardState) {
  snapshot = next;
  if (!next.storageError) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...next, notice: null, storageError: null }));
  }
  emit();
}

export function useDashboard(): DashboardState {
  return useSyncExternalStore(subscribe, getClientSnapshot, () => SERVER_STATE);
}

function activeProfile(state: DashboardState): Profile | undefined {
  return state.profiles.find((profile) => profile.id === state.activeProfileId);
}

function markShown(
  history: Record<string, ProfileJobHistory>,
  profileId: string,
  opportunities: { id: string }[],
  batchNumber: number,
): Record<string, ProfileJobHistory> {
  const now = new Date().toISOString();
  const next = { ...history };
  for (const opportunity of opportunities) {
    if (next[opportunity.id]) continue;
    next[opportunity.id] = {
      opportunityId: opportunity.id,
      profileId,
      firstShownAt: now,
      lastShownAt: now,
      batchNumber,
      status: "shown",
      events: [{ action: "shown", at: now }],
    };
  }
  return next;
}

export function selectProfile(profileId: string) {
  const state = getClientSnapshot();
  if (!state.profiles.some((profile) => profile.id === profileId)) return;
  commit({ ...state, activeProfileId: profileId, notice: null });
}

export function addProfile() {
  const state = getClientSnapshot();
  const profile: Profile = {
    id: `profile-${crypto.randomUUID()}`,
    name: "New profile",
    resumeText: "",
    careerInterests: "",
    version: 1,
    preferences: {
      locations: ["remote-us"],
      minSalary: 0,
      workArrangements: ["remote", "hybrid", "on-site"],
      employmentTypes: ["full-time"],
    },
  };
  commit({
    ...state,
    profiles: [...state.profiles, profile],
    activeProfileId: profile.id,
    notice: null,
  });
}

export function updateProfile(profile: Profile) {
  const state = getClientSnapshot();
  const current = state.profiles.find((item) => item.id === profile.id);
  const version = current ? current.version + 1 : profile.version;
  const nextProfile = { ...profile, version };
  commit({
    ...state,
    profiles: state.profiles.map((item) => (item.id === profile.id ? nextProfile : item)),
    scoresByProfile: { ...state.scoresByProfile, [profile.id]: {} },
    notice: null,
  });
}

export function deleteProfile(profileId: string) {
  const state = getClientSnapshot();
  if (state.profiles.length <= 1) return;
  const profiles = state.profiles.filter((profile) => profile.id !== profileId);
  const historyByProfile = { ...state.historyByProfile };
  const scoresByProfile = { ...state.scoresByProfile };
  const searchRunByProfile = { ...state.searchRunByProfile };
  delete historyByProfile[profileId];
  delete scoresByProfile[profileId];
  delete searchRunByProfile[profileId];
  commit({
    ...state,
    profiles,
    activeProfileId:
      state.activeProfileId === profileId ? profiles[0].id : state.activeProfileId,
    historyByProfile,
    scoresByProfile,
    searchRunByProfile,
    notice: null,
  });
}

export function findJobs(profileId: string, criteria: SearchCriteria) {
  const state = getClientSnapshot();
  const profile = state.profiles.find((item) => item.id === profileId);
  if (!profile) return;
  const history = state.historyByProfile[profileId] ?? {};
  const { batch, scores } = unseenBatch({
    profile,
    criteria,
    indexCursor: state.indexCursor,
    history,
    scores: state.scoresByProfile[profileId] ?? {},
    limit: criteria.batchSize,
  });
  const run: SearchRun = {
    id: `run-${Date.now()}`,
    profileId,
    criteria,
    startedAt: new Date().toISOString(),
    batchesLoaded: 1,
    exhausted: batch.length < criteria.batchSize,
    feedIds: batch.map((item) => item.opportunity.id),
  };
  commit({
    ...state,
    historyByProfile: {
      ...state.historyByProfile,
      [profileId]: markShown(
        history,
        profileId,
        batch.map((item) => item.opportunity),
        1,
      ),
    },
    scoresByProfile: { ...state.scoresByProfile, [profileId]: scores },
    searchRunByProfile: { ...state.searchRunByProfile, [profileId]: run },
    notice:
      batch.length === 0
        ? "No unseen matches in this window. Widen Posted within, or refresh for newly indexed roles."
        : `Loaded ${batch.length} ranked ${batch.length === 1 ? "opportunity" : "opportunities"}.`,
  });
}

export function findMore(profileId: string) {
  const state = getClientSnapshot();
  const run = state.searchRunByProfile[profileId];
  const profile = state.profiles.find((item) => item.id === profileId);
  if (!run || run.exhausted || !profile) return;
  const history = state.historyByProfile[profileId] ?? {};
  const batchNumber = run.batchesLoaded + 1;
  const { batch, scores } = unseenBatch({
    profile,
    criteria: run.criteria,
    indexCursor: state.indexCursor,
    history,
    scores: state.scoresByProfile[profileId] ?? {},
    limit: run.criteria.batchSize,
  });
  commit({
    ...state,
    historyByProfile: {
      ...state.historyByProfile,
      [profileId]: markShown(
        history,
        profileId,
        batch.map((item) => item.opportunity),
        batchNumber,
      ),
    },
    scoresByProfile: { ...state.scoresByProfile, [profileId]: scores },
    searchRunByProfile: {
      ...state.searchRunByProfile,
      [profileId]: {
        ...run,
        batchesLoaded: batchNumber,
        exhausted: batch.length < run.criteria.batchSize,
        feedIds: [...run.feedIds, ...batch.map((item) => item.opportunity.id)],
      },
    },
    notice:
      batch.length === 0
        ? "No further unseen matches for this search."
        : `Added ${batch.length} more unseen ${batch.length === 1 ? "opportunity" : "opportunities"}.`,
  });
}

export function refreshNew(profileId: string) {
  const state = getClientSnapshot();
  const profile = state.profiles.find((item) => item.id === profileId);
  if (!profile) return;
  if (state.indexCursor >= MAX_INDEX_WAVE) {
    commit({ ...state, notice: "No further indexed roles in this mock." });
    return;
  }
  const wave = state.indexCursor + 1;
  const criteria =
    state.searchRunByProfile[profileId]?.criteria ?? criteriaFromProfile(profile);
  const history = state.historyByProfile[profileId] ?? {};
  const { batch, scores } = newlyIndexed({
    profile,
    criteria,
    wave,
    history,
    scores: state.scoresByProfile[profileId] ?? {},
  });
  const existing = state.searchRunByProfile[profileId];
  const addedIds = batch.map((item) => item.opportunity.id);
  const run: SearchRun = existing
    ? {
        ...existing,
        feedIds: [...(existing.feedIds ?? []), ...addedIds],
      }
    : {
        id: `run-${Date.now()}`,
        profileId,
        criteria,
        startedAt: new Date().toISOString(),
        batchesLoaded: 1,
        exhausted: false,
        feedIds: addedIds,
      };
  commit({
    ...state,
    indexCursor: wave,
    historyByProfile: {
      ...state.historyByProfile,
      [profileId]: markShown(
        history,
        profileId,
        batch.map((item) => item.opportunity),
        (existing?.batchesLoaded ?? 0) + 1,
      ),
    },
    searchRunByProfile: {
      ...state.searchRunByProfile,
      [profileId]: run,
    },
    scoresByProfile: { ...state.scoresByProfile, [profileId]: scores },
    notice:
      batch.length === 0
        ? "Newly indexed roles did not match these filters."
        : `Refresh added ${batch.length} newly indexed ${batch.length === 1 ? "opportunity" : "opportunities"}.`,
  });
}

export function setJobStatus(profileId: string, opportunityId: string, action: JobAction) {
  const state = getClientSnapshot();
  const history = { ...(state.historyByProfile[profileId] ?? {}) };
  const current = history[opportunityId];
  const now = new Date().toISOString();
  if (!current) {
    history[opportunityId] = {
      opportunityId,
      profileId,
      firstShownAt: now,
      lastShownAt: now,
      batchNumber: 0,
      status: action,
      events: [
        { action: "shown", at: now },
        { action, at: now },
      ],
    };
  } else if (current.status !== action) {
    history[opportunityId] = {
      ...current,
      status: action,
      lastShownAt: now,
      events: [...current.events, { action, at: now }],
    };
  } else {
    return;
  }
  commit({
    ...state,
    historyByProfile: { ...state.historyByProfile, [profileId]: history },
    notice: null,
  });
}

export function resetStorage() {
  window.localStorage.removeItem(STORAGE_KEY);
  snapshot = seedState();
  emit();
}

export function currentProfile(state: DashboardState): Profile {
  return activeProfile(state) ?? state.profiles[0];
}
