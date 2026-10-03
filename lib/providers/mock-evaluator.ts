import { SCORING_VERSION } from "@/lib/domain/priority";
import { assessSeniority, inferCandidateSeniority } from "@/lib/domain/seniority";
import type { JobScore, Opportunity, Profile } from "@/lib/domain/types";
import type { JobEvaluator } from "@/lib/providers/types";

const CONCEPTS: { id: string; label: string; terms: string[] }[] = [
  {
    id: "cadence",
    label: "Operating cadence and planning",
    terms: ["operating cadence", "quarterly planning", "okrs", "business review"],
  },
  {
    id: "exec",
    label: "Executive and board support",
    terms: ["board materials", "board deck", "executive priorities", "founder priorities"],
  },
  {
    id: "finance",
    label: "Financial planning",
    terms: [
      "strategic finance",
      "financial modeling",
      "headcount plan",
      "variance notes",
      "unit economics",
      "forecast",
    ],
  },
  {
    id: "corpdev",
    label: "Corporate development",
    terms: ["corporate development", "due diligence", "investment memo", "market landscape"],
  },
  {
    id: "initiatives",
    label: "Strategic initiatives",
    terms: ["strategic initiative", "decision memo", "decision support", "special projects"],
  },
  {
    id: "portfolio",
    label: "Portfolio operations",
    terms: ["portfolio operations", "portfolio companies"],
  },
  {
    id: "bizops",
    label: "Business operations",
    terms: ["business operations", "cross-functional coordination"],
  },
  {
    id: "founder",
    label: "Founder's office",
    terms: ["founder's office", "chief of staff", "supporting a founder"],
  },
  {
    id: "ml",
    label: "Applied machine learning",
    terms: [
      "pytorch",
      "model training",
      "offline evaluation",
      "ranking model",
      "classification model",
      "applied machine learning",
    ],
  },
  {
    id: "ml-infra",
    label: "ML infrastructure",
    terms: ["feature pipeline", "model monitoring", "ml infrastructure", "training cluster"],
  },
  {
    id: "backend",
    label: "Backend services",
    terms: ["postgres", "go services", "api latency", "backend service", "backend engineering"],
  },
  {
    id: "sales",
    label: "Outbound sales",
    terms: ["cold call", "sales quota", "outbound calls"],
  },
  {
    id: "accounting",
    label: "Accounting close",
    terms: ["journal entries", "close the books", "reconciliations"],
  },
  {
    id: "clinical",
    label: "Clinical care",
    terms: ["patient panel", "clinic visits"],
  },
  {
    id: "warehouse",
    label: "Warehouse operations",
    terms: ["picking accuracy", "warehouse shift"],
  },
  {
    id: "design",
    label: "Product design",
    terms: ["visual design", "prototyping"],
  },
  {
    id: "support",
    label: "Customer support",
    terms: ["support queue", "support macros"],
  },
  {
    id: "recruiting",
    label: "Recruiting",
    terms: ["candidate slate", "intake meeting"],
  },
  {
    id: "marketing",
    label: "Marketing campaigns",
    terms: ["campaign calendar", "paid social"],
  },
  {
    id: "product",
    label: "Product management",
    terms: ["product roadmap", "product spec"],
  },
  {
    id: "writing",
    label: "Technical writing",
    terms: ["operator guide", "admin manual"],
  },
];

function conceptsIn(text: string): Map<string, string> {
  const haystack = text.toLowerCase();
  const found = new Map<string, string>();
  for (const concept of CONCEPTS) {
    if (concept.terms.some((term) => haystack.includes(term))) {
      found.set(concept.id, concept.label);
    }
  }
  return found;
}

function overlapPercent(jobConcepts: Map<string, string>, profileConcepts: Map<string, string>): number {
  if (jobConcepts.size === 0) return 20;
  let hits = 0;
  for (const id of jobConcepts.keys()) {
    if (profileConcepts.has(id)) hits += 1;
  }
  return Math.round((hits / jobConcepts.size) * 100);
}

function skillFit(profile: Profile, opportunity: Opportunity): number {
  const resume = profile.resumeText.toLowerCase();
  const required = opportunity.requiredSkills;
  const preferred = opportunity.preferredSkills;
  if (required.length === 0 && preferred.length === 0) {
    const jobConcepts = conceptsIn(opportunity.responsibilities.join(" "));
    const profileConcepts = conceptsIn(profile.resumeText);
    return overlapPercent(jobConcepts, profileConcepts);
  }
  const requiredHits = required.filter((skill) => resume.includes(skill.toLowerCase())).length;
  const preferredHits = preferred.filter((skill) => resume.includes(skill.toLowerCase())).length;
  const denom = required.length + preferred.length * 0.5;
  const numer = requiredHits + preferredHits * 0.5;
  if (denom === 0) return 50;
  return Math.round((numer / denom) * 100);
}

function yearFit(candidateYears: number, yearsMin?: number, yearsMax?: number): number {
  if (yearsMin == null && yearsMax == null) return 70;
  if (yearsMin != null && candidateYears + 0.5 >= yearsMin && (yearsMax == null || candidateYears <= yearsMax + 2)) {
    return 92;
  }
  if (yearsMin != null && candidateYears + 2 >= yearsMin) return 68;
  if (yearsMin != null && candidateYears + 4 >= yearsMin) return 45;
  if (yearsMax != null && candidateYears > yearsMax + 2) return 40;
  return 55;
}

function interestClauses(interests: string): string[] {
  return interests
    .toLowerCase()
    .split(/[,.]|\bor\b|\band\b/g)
    .map((clause) => clause.trim())
    .filter((clause) => clause.split(/\s+/).filter(Boolean).length >= 2);
}

function interestFit(profile: Profile, opportunity: Opportunity): number {
  const jobText = [
    opportunity.title,
    ...opportunity.responsibilities,
    ...opportunity.requirements,
  ]
    .join(" ")
    .toLowerCase();
  const jobConcepts = conceptsIn(
    [...opportunity.responsibilities, ...opportunity.requirements, opportunity.title].join(" "),
  );
  const interestConcepts = conceptsIn(profile.careerInterests);
  const conceptScore = overlapPercent(jobConcepts, interestConcepts);
  const clauses = interestClauses(profile.careerInterests);
  if (clauses.length === 0) return conceptScore;
  const clauseHits = clauses.filter((clause) => jobText.includes(clause)).length;
  const clauseScore = Math.round((clauseHits / clauses.length) * 100);
  return Math.max(conceptScore, clauseScore);
}

function hearback(score: Omit<JobScore, "hearback_estimate" | "strengths" | "gaps" | "reasoning">): JobScore["hearback_estimate"] {
  if (
    score.qualification_fit >= 78 &&
    score.seniority_assessment === "strong_fit" &&
    score.responsibility_fit >= 60
  ) {
    return "High";
  }
  if (
    score.qualification_fit >= 55 &&
    score.seniority_assessment !== "too_senior" &&
    score.responsibility_fit >= 40
  ) {
    return "Medium";
  }
  return "Low";
}

function reasons(
  overlapLabels: string[],
  responsibility: number,
  interest: number,
  seniorityLabel: string,
): string[] {
  const items = [...overlapLabels];
  if (items.length < 3 && responsibility >= 60) {
    items.push("The day-to-day responsibilities match work already in the resume");
  }
  if (items.length < 3 && interest >= 55) {
    items.push("The work sits inside the interests written on this profile");
  }
  if (items.length < 3 && seniorityLabel === "Strong fit") {
    items.push("The experience asked for is close to the years on the resume");
  }
  if (items.length === 0) {
    return [
      "Little of the stated work shows up in the resume",
      "The requirements sit outside the interests on this profile",
      "Ranked low because the responsibilities do not match",
    ];
  }
  const fillers = [
    "No further strong overlap on this profile",
    "The other score dimensions are weaker than these",
    "Nothing else in the posting is as close as the points above",
  ];
  for (const filler of fillers) {
    if (items.length >= 3) break;
    if (!items.includes(filler)) items.push(filler);
  }
  return items.slice(0, 3);
}

export const mockJobEvaluator: JobEvaluator = {
  scoringVersion: SCORING_VERSION,
  evaluate(profile: Profile, opportunity: Opportunity): JobScore {
    const candidate = inferCandidateSeniority(profile);
    const responsibilityText = opportunity.responsibilities.join(" ");
    const requirementText = opportunity.requirements.join(" ");
    const profileText = `${profile.resumeText}\n${profile.careerInterests}`;
    const jobConcepts = conceptsIn(responsibilityText);
    const profileConcepts = conceptsIn(profileText);
    const resumeConcepts = conceptsIn(profile.resumeText);
    const responsibility = overlapPercent(jobConcepts, profileConcepts);
    const career = overlapPercent(jobConcepts, resumeConcepts);
    const skills = skillFit(profile, opportunity);
    const interest = interestFit(profile, opportunity);
    const years = yearFit(candidate.years, opportunity.yearsMin, opportunity.yearsMax);
    const requirementConcepts = conceptsIn(requirementText);
    const requirementCover = overlapPercent(requirementConcepts, profileConcepts);
    const qualification = Math.round(years * 0.55 + requirementCover * 0.45);
    const seniority = assessSeniority({
      candidateYears: candidate.years,
      yearsMin: opportunity.yearsMin,
      yearsMax: opportunity.yearsMax,
      requirementsText: requirementText,
    });
    const industryHaystack = profileText.toLowerCase();
    const industry = industryHaystack.includes(opportunity.industry.toLowerCase())
      ? 86
      : responsibility >= 50
        ? 64
        : 30;

    const overlapLabels = [...jobConcepts.entries()]
      .filter(([id]) => profileConcepts.has(id))
      .map(([, label]) => label);

    const missingSkills = opportunity.requiredSkills.filter(
      (skill) => !profile.resumeText.toLowerCase().includes(skill.toLowerCase()),
    );
    const missingConcepts = [...jobConcepts.entries()]
      .filter(([id]) => !profileConcepts.has(id))
      .map(([, label]) => label);
    const gaps = [...missingSkills.map((skill) => `Resume does not show ${skill}`), ...missingConcepts].slice(0, 3);
    if (gaps.length === 0) gaps.push("No major gap against the stated responsibilities");

    const partial = {
      qualification_fit: qualification,
      responsibility_fit: responsibility,
      skills_fit: skills,
      interest_fit: interest,
      career_fit: career,
      seniority_fit: seniority.fit,
      industry_fit: industry,
      seniority_assessment: seniority.assessment,
    };

    const strengths = reasons(
      overlapLabels,
      responsibility,
      interest,
      seniority.assessment === "strong_fit"
        ? "Strong fit"
        : seniority.assessment === "reasonable_stretch"
          ? "Stretch"
          : "Other",
    );

    const reasoning = `${profile.name.split(" ")[0]} ${
      responsibility >= 60 ? "has done work close to these responsibilities" : "has limited overlap with these responsibilities"
    }. Seniority is ${seniority.assessment.replaceAll("_", " ")} for about ${candidate.years} years on the resume. Estimated hearback is not a probability.`;

    return {
      ...partial,
      hearback_estimate: hearback(partial),
      strengths,
      gaps,
      reasoning,
    };
  },
};
