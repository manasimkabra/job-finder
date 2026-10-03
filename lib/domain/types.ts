export const SOURCE_TYPES = ["FORMAL_JOB", "HIRING_POST"] as const;

export type SourceType = (typeof SOURCE_TYPES)[number];

export const WORK_ARRANGEMENTS = ["remote", "hybrid", "on-site"] as const;

export type WorkArrangement = (typeof WORK_ARRANGEMENTS)[number];

export const EMPLOYMENT_TYPES = ["full-time", "contract", "internship"] as const;

export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const POSTED_WITHIN = [
  "6h",
  "12h",
  "24h",
  "3d",
  "7d",
  "14d",
  "30d",
  "any",
] as const;

export type PostedWithin = (typeof POSTED_WITHIN)[number];

export const BATCH_SIZES = [25, 50, 100] as const;

export type BatchSize = (typeof BATCH_SIZES)[number];

export const SENIORITY_ASSESSMENTS = [
  "below_candidate_level",
  "strong_fit",
  "reasonable_stretch",
  "too_senior",
] as const;

export type SeniorityAssessment = (typeof SENIORITY_ASSESSMENTS)[number];

export const HEARBACK_ESTIMATES = ["High", "Medium", "Low"] as const;

export type HearbackEstimate = (typeof HEARBACK_ESTIMATES)[number];

export const JOB_ACTIONS = [
  "shown",
  "saved",
  "applied",
  "not_interested",
  "rejected",
  "recruiter_response",
  "interview",
  "offer",
] as const;

export type JobAction = (typeof JOB_ACTIONS)[number];

export const INBOX_VIEWS = [
  "recommendations",
  "saved",
  "applied",
  "responses",
  "interviews",
  "skipped",
  "archive",
] as const;

export type InboxView = (typeof INBOX_VIEWS)[number];

export type SeniorityOverride = "resume" | "strong-and-stretch" | "strong-only";

/** Public hiring post. Mock text only. */
export type HiringPost = {
  id: string;
  source: "HIRING_POST";
  author_name: string;
  author_title?: string;
  company?: string;
  post_text: string;
  posted_at: string;
  location?: string;
  inferred_role: string;
  original_url: string;
  application_instructions?: string;
};

export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  locationIds: string[];
  workArrangement: WorkArrangement;
  employmentType: EmploymentType;
  salaryMin?: number;
  salaryMax?: number;
  postedAt: string;
  industry: string;
  responsibilities: string[];
  requirements: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  yearsExperienceMin?: number;
  yearsExperienceMax?: number;
  applyUrl: string;
  indexWave: number;
  contentVersion: number;
};

export type ProfilePreferences = {
  locations: string[];
  minSalary: number;
  workArrangements: WorkArrangement[];
  employmentTypes: EmploymentType[];
};

export type Profile = {
  id: string;
  name: string;
  resumeText: string;
  careerInterests: string;
  preferences: ProfilePreferences;
  version: number;
};

/** Shared listing, normalized from a formal job or a hiring post. */
export type Opportunity = {
  id: string;
  source: SourceType;
  title: string;
  company?: string;
  locationLabel?: string;
  locationIds: string[];
  workArrangement?: WorkArrangement;
  employmentType?: EmploymentType;
  salaryMin?: number;
  salaryMax?: number;
  postedAt: string;
  industry: string;
  summary: string;
  responsibilities: string[];
  requirements: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  yearsMin?: number;
  yearsMax?: number;
  url: string;
  indexWave: number;
  contentVersion: number;
  hiringPost?: HiringPost;
};

export type JobScore = {
  qualification_fit: number;
  responsibility_fit: number;
  skills_fit: number;
  interest_fit: number;
  career_fit: number;
  seniority_fit: number;
  industry_fit: number;
  seniority_assessment: SeniorityAssessment;
  hearback_estimate: HearbackEstimate;
  strengths: string[];
  gaps: string[];
  reasoning: string;
};

export type ProfileJobHistory = {
  opportunityId: string;
  profileId: string;
  firstShownAt: string;
  lastShownAt: string;
  batchNumber: number;
  status: JobAction;
  events: { action: JobAction; at: string }[];
};

export type SearchCriteria = {
  postedWithin: PostedWithin;
  locations: string[];
  workArrangements: WorkArrangement[];
  minSalary: number | null;
  employmentTypes: EmploymentType[];
  batchSize: BatchSize;
  keyword: string;
  seniorityOverride: SeniorityOverride;
};

export type SearchRun = {
  id: string;
  profileId: string;
  criteria: SearchCriteria;
  startedAt: string;
  batchesLoaded: number;
  exhausted: boolean;
  /** Opportunity ids in the current Find Jobs / Find More batch. */
  feedIds: string[];
};

export type ScoredOpportunity = {
  opportunity: Opportunity;
  score: JobScore;
  priority: number;
};
