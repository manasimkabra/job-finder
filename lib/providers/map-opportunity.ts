import type { HiringPost, Job, Opportunity, WorkArrangement } from "@/lib/domain/types";
import { locationIdsFromLabel } from "@/lib/domain/locations";

export function jobToOpportunity(job: Job): Opportunity {
  return {
    id: job.id,
    source: "FORMAL_JOB",
    title: job.title,
    company: job.company,
    locationLabel: job.location,
    locationIds: job.locationIds,
    workArrangement: job.workArrangement,
    employmentType: job.employmentType,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    postedAt: job.postedAt,
    industry: job.industry,
    summary: job.responsibilities[0] ?? job.title,
    responsibilities: job.responsibilities,
    requirements: job.requirements,
    requiredSkills: job.requiredSkills,
    preferredSkills: job.preferredSkills,
    yearsMin: job.yearsExperienceMin,
    yearsMax: job.yearsExperienceMax,
    url: job.applyUrl,
    indexWave: job.indexWave,
    contentVersion: job.contentVersion,
  };
}

function industryFromPost(post: HiringPost): string {
  const text = `${post.post_text} ${post.inferred_role}`.toLowerCase();
  if (text.includes("pytorch") || text.includes("machine learning")) return "machine learning";
  if (text.includes("backend") || text.includes("postgres")) return "software";
  if (text.includes("cold call") || text.includes("quota")) return "sales";
  if (text.includes("auditor")) return "hospitality";
  return "business operations";
}

function arrangementFromPost(post: HiringPost): WorkArrangement | undefined {
  const text = `${post.post_text} ${post.location ?? ""}`;
  if (/hybrid/i.test(text)) return "hybrid";
  if (/on-site/i.test(text)) return "on-site";
  if (/remote/i.test(text) || post.location === "Remote - US") return "remote";
  return undefined;
}

export function postToOpportunity(post: HiringPost): Opportunity {
  const locationIds = locationIdsFromLabel(post.location);
  return {
    id: post.id,
    source: "HIRING_POST",
    title: post.inferred_role,
    company: post.company,
    locationLabel: post.location,
    locationIds,
    workArrangement: arrangementFromPost(post),
    employmentType: /contract/i.test(post.post_text)
      ? "contract"
      : /full-time/i.test(post.post_text)
        ? "full-time"
        : undefined,
    postedAt: post.posted_at,
    industry: industryFromPost(post),
    summary: post.post_text,
    responsibilities: [post.post_text],
    requirements: post.application_instructions
      ? [post.application_instructions]
      : [],
    requiredSkills: [],
    preferredSkills: [],
    url: post.original_url,
    indexWave: 0,
    contentVersion: 1,
    hiringPost: post,
  };
}
