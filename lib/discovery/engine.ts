import { locationMatches } from "@/lib/domain/locations";
import { priorityScore, scoreCacheKey } from "@/lib/domain/priority";
import { withinPostedWindow } from "@/lib/domain/time";
import type {
  JobScore,
  Opportunity,
  Profile,
  ProfileJobHistory,
  ScoredOpportunity,
  SearchCriteria,
  SeniorityAssessment,
} from "@/lib/domain/types";
import { getDiscoveryProviders, getJobEvaluator } from "@/lib/providers/registry";

export const MAX_INDEX_WAVE = 1;

let catalogCache: Opportunity[] | null = null;

export function allOpportunities(): Opportunity[] {
  if (!catalogCache) {
    catalogCache = getDiscoveryProviders().flatMap((provider) => provider.list());
  }
  return catalogCache;
}

export function getOpportunity(id: string): Opportunity | undefined {
  return allOpportunities().find((opportunity) => opportunity.id === id);
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function sameOpening(formal: Opportunity, post: Opportunity): boolean {
  if (!formal.company || !post.company) return false;
  if (normalize(formal.company) !== normalize(post.company)) return false;
  const title = normalize(formal.title);
  const role = normalize(post.title);
  if (title === role) return true;
  const tokens = role.split(" ").filter((token) => token.length > 3);
  if (tokens.length === 0) return false;
  const hits = tokens.filter((token) => title.includes(token)).length;
  return hits / tokens.length >= 0.6;
}

export function dedupedOpportunities(indexCursor: number): Opportunity[] {
  const all = allOpportunities();
  const formal = all.filter((item) => item.source === "FORMAL_JOB");
  return all
    .filter((item) => item.indexWave <= indexCursor)
    .filter((item) => {
      if (item.source !== "HIRING_POST") return true;
      return !formal.some((job) => sameOpening(job, item));
    });
}

function keywordOk(opportunity: Opportunity, keyword: string): boolean {
  const tokens = keyword.toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const haystack = [
    opportunity.title,
    opportunity.company ?? "",
    opportunity.summary,
    opportunity.locationLabel ?? "",
    ...opportunity.responsibilities,
    ...opportunity.requirements,
  ]
    .join(" ")
    .toLowerCase();
  return tokens.every((token) => haystack.includes(token));
}

function salaryOk(opportunity: Opportunity, minSalary: number | null): boolean {
  if (minSalary == null || minSalary <= 0) return true;
  if (opportunity.salaryMin == null && opportunity.salaryMax == null) return true;
  const top = opportunity.salaryMax ?? opportunity.salaryMin ?? 0;
  return top >= minSalary;
}

function seniorityAllowed(
  assessment: SeniorityAssessment,
  override: SearchCriteria["seniorityOverride"],
): boolean {
  if (override === "resume") return true;
  if (override === "strong-only") return assessment === "strong_fit";
  return assessment === "strong_fit" || assessment === "reasonable_stretch";
}

export function scoreOpportunity(
  profile: Profile,
  opportunity: Opportunity,
  stored: Record<string, JobScore>,
): ScoredOpportunity {
  const key = scoreCacheKey(profile.version, opportunity.id, opportunity.contentVersion);
  const evaluator = getJobEvaluator();
  const score = stored[key] ?? evaluator.evaluate(profile, opportunity);
  return { opportunity, score, priority: priorityScore(score) };
}

export function rankEligible(input: {
  profile: Profile;
  criteria: SearchCriteria;
  indexCursor: number;
  scores: Record<string, JobScore>;
}): { ranked: ScoredOpportunity[]; scores: Record<string, JobScore> } {
  const nextScores = { ...input.scores };
  const ranked = dedupedOpportunities(input.indexCursor)
    .filter((opportunity) => withinPostedWindow(opportunity.postedAt, input.criteria.postedWithin))
    .filter((opportunity) => locationMatches(opportunity.locationIds, input.criteria.locations))
    .filter((opportunity) => {
      if (input.criteria.workArrangements.length === 0) return true;
      if (!opportunity.workArrangement) return true;
      return input.criteria.workArrangements.includes(opportunity.workArrangement);
    })
    .filter((opportunity) => {
      if (input.criteria.employmentTypes.length === 0) return true;
      if (!opportunity.employmentType) return true;
      return input.criteria.employmentTypes.includes(opportunity.employmentType);
    })
    .filter((opportunity) => salaryOk(opportunity, input.criteria.minSalary))
    .filter((opportunity) => keywordOk(opportunity, input.criteria.keyword))
    .map((opportunity) => {
      const scored = scoreOpportunity(input.profile, opportunity, nextScores);
      const key = scoreCacheKey(
        input.profile.version,
        opportunity.id,
        opportunity.contentVersion,
      );
      nextScores[key] = scored.score;
      return scored;
    })
    .filter((scored) =>
      seniorityAllowed(scored.score.seniority_assessment, input.criteria.seniorityOverride),
    )
    .sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return b.opportunity.postedAt.localeCompare(a.opportunity.postedAt);
    });

  return { ranked, scores: nextScores };
}

export function unseenBatch(input: {
  profile: Profile;
  criteria: SearchCriteria;
  indexCursor: number;
  history: Record<string, ProfileJobHistory>;
  scores: Record<string, JobScore>;
  limit: number;
}): { batch: ScoredOpportunity[]; scores: Record<string, JobScore> } {
  const { ranked, scores } = rankEligible(input);
  const batch = ranked
    .filter((item) => !input.history[item.opportunity.id])
    .slice(0, input.limit);
  return { batch, scores };
}

export function newlyIndexed(input: {
  profile: Profile;
  criteria: SearchCriteria;
  wave: number;
  history: Record<string, ProfileJobHistory>;
  scores: Record<string, JobScore>;
}): { batch: ScoredOpportunity[]; scores: Record<string, JobScore> } {
  const { ranked, scores } = rankEligible({ ...input, indexCursor: input.wave });
  const batch = ranked.filter(
    (item) =>
      item.opportunity.indexWave === input.wave && !input.history[item.opportunity.id],
  );
  return { batch, scores };
}
