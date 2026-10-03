import type { Profile, SeniorityAssessment } from "@/lib/domain/types";

const BOARD_YEAR = 2026;

export type CandidateSeniority = {
  years: number;
  depth: number;
  label: string;
};

export function inferYears(resumeText: string): number {
  const ranges = resumeText.matchAll(
    /(20\d{2})\s*[–-]\s*(20\d{2}|present)/gi,
  );
  let years = 0;
  for (const match of ranges) {
    const start = Number(match[1]);
    const end = /present/i.test(match[2]) ? BOARD_YEAR : Number(match[2]);
    years += Math.max(0, end - start);
  }
  return years;
}

/** Resume-only. Titles of open jobs are not an input. */
export function inferCandidateSeniority(profile: Profile): CandidateSeniority {
  const years = inferYears(profile.resumeText);
  const text = profile.resumeText.toLowerCase();
  let depth = Math.min(72, years * 8);
  if (/\b(owned|ownership)\b/.test(text)) depth += 8;
  if (/\bled\b|\bleading\b/.test(text)) depth += 4;
  if (/\bdirector\b|\bvice president\b|\bvp\b/.test(text)) depth += 22;
  if (/managed (a|the) team/.test(text)) depth += 12;
  depth = Math.min(100, depth);
  const scope =
    depth >= 75
      ? "function-level scope"
      : "individual contributor scope, with ownership where the resume says so";
  const label =
    years === 0
      ? "Seniority is unclear from the resume"
      : `About ${years} years · ${scope}`;
  return { years, depth, label };
}

export function assessSeniority(input: {
  candidateYears: number;
  yearsMin?: number;
  yearsMax?: number;
  requirementsText: string;
}): { assessment: SeniorityAssessment; fit: number } {
  const { candidateYears, yearsMin, yearsMax } = input;
  const requirements = input.requirementsText.toLowerCase();
  const leadsFunction =
    /lead the function|own the p&l|manage managers|org-wide architecture/.test(
      requirements,
    );

  let assessment: SeniorityAssessment;
  if (yearsMax != null && yearsMax <= 1 && candidateYears >= 3) {
    assessment = "below_candidate_level";
  } else if (
    (yearsMin != null && yearsMin >= candidateYears + 5) ||
    (leadsFunction && yearsMin != null && yearsMin >= candidateYears + 3)
  ) {
    assessment = "too_senior";
  } else if (
    (yearsMin == null || candidateYears + 0.5 >= yearsMin) &&
    (yearsMax == null || candidateYears <= yearsMax + 2)
  ) {
    assessment = "strong_fit";
  } else if (yearsMin != null && candidateYears + 2 >= yearsMin) {
    assessment = "reasonable_stretch";
  } else if (yearsMax != null && candidateYears > yearsMax + 2) {
    assessment = "below_candidate_level";
  } else {
    assessment = "too_senior";
  }

  const fit = {
    strong_fit: 90,
    reasonable_stretch: 72,
    below_candidate_level: 46,
    too_senior: 28,
  }[assessment];

  return { assessment, fit };
}
