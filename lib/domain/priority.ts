import type { JobScore } from "@/lib/domain/types";

/** Bump when component weights or the seniority penalty change. */
export const SCORING_VERSION = "2026.09.1";

/**
 * One weighting function. Priority is never stored on mock jobs.
 * Responsibility and interest outweigh title-like signals.
 * Clearly unrealistic seniority is heavily down-ranked, not deleted.
 */
export function priorityScore(score: JobScore): number {
  const weighted =
    score.responsibility_fit * 0.24 +
    score.qualification_fit * 0.16 +
    score.interest_fit * 0.16 +
    score.skills_fit * 0.14 +
    score.career_fit * 0.12 +
    score.seniority_fit * 0.1 +
    score.industry_fit * 0.08;

  const factor =
    score.seniority_assessment === "too_senior"
      ? 0.4
      : score.seniority_assessment === "below_candidate_level"
        ? 0.7
        : 1;

  return Math.max(0, Math.min(100, Math.round(weighted * factor)));
}

export function scoreCacheKey(
  profileVersion: number,
  opportunityId: string,
  contentVersion: number,
): string {
  return `${SCORING_VERSION}:${profileVersion}:${opportunityId}:${contentVersion}`;
}
