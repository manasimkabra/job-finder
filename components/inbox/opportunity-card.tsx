import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  actionLabel,
  arrangementLabel,
  assessmentLabel,
  employmentLabel,
  salaryLabel,
} from "@/lib/domain/format";
import { hoursAgo, postedAgoLabel } from "@/lib/domain/time";
import type {
  JobAction,
  JobScore,
  Opportunity,
  ProfileJobHistory,
} from "@/lib/domain/types";
import { setJobStatus } from "@/lib/storage/dashboard-store";

const FIT_FIELDS: { key: keyof JobScore; label: string }[] = [
  { key: "qualification_fit", label: "Qualification" },
  { key: "responsibility_fit", label: "Responsibility" },
  { key: "skills_fit", label: "Skills" },
  { key: "interest_fit", label: "Interest" },
  { key: "career_fit", label: "Career" },
  { key: "seniority_fit", label: "Seniority" },
  { key: "industry_fit", label: "Industry" },
];

const OUTCOME_ACTIONS: JobAction[] = [
  "applied",
  "recruiter_response",
  "interview",
  "rejected",
  "offer",
];

function isAppliedOrLater(status?: JobAction): boolean {
  return status != null && OUTCOME_ACTIONS.includes(status);
}

export function OpportunityCard({
  opportunity,
  score,
  priority,
  rank,
  history,
  profileId,
  detailed = false,
}: {
  opportunity: Opportunity;
  score: JobScore;
  priority: number;
  rank?: number;
  history?: ProfileJobHistory;
  profileId: string;
  detailed?: boolean;
}) {
  const post = opportunity.hiringPost;
  const meta = [
    opportunity.company,
    opportunity.locationLabel,
    opportunity.workArrangement ? arrangementLabel(opportunity.workArrangement) : null,
    opportunity.employmentType ? employmentLabel(opportunity.employmentType) : null,
    salaryLabel(opportunity.salaryMin, opportunity.salaryMax),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article
      className="rounded-xl border bg-card p-4 sm:p-5"
      data-opportunity-id={opportunity.id}
      data-source={opportunity.source}
      data-hours={Math.round(hoursAgo(opportunity.postedAt))}
      data-location={opportunity.locationIds.join(" ")}
      data-priority={priority}
    >
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex items-end justify-between gap-3 sm:w-20 sm:flex-col sm:items-start">
          <div>
            {rank != null ? (
              <p className="text-xs font-medium text-muted-foreground">#{rank}</p>
            ) : null}
            <p className="font-heading text-4xl leading-none tracking-tight">{priority}</p>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Priority
            </p>
          </div>
          <p className="text-xs text-muted-foreground sm:mt-2">{postedAgoLabel(opportunity.postedAt)}</p>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{opportunity.source === "HIRING_POST" ? "Hiring Post" : "Formal role"}</Badge>
            <p className="text-xs text-muted-foreground" title="Estimate only, not a calibrated probability.">
              Estimated hearback: {score.hearback_estimate}
            </p>
          </div>
          <h2 className="mt-2 font-heading text-2xl font-medium tracking-tight">
            {opportunity.title}
          </h2>
          {post ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {[post.author_name, post.author_title, post.company].filter(Boolean).join(" · ")}
            </p>
          ) : null}
          <p className="mt-1 text-sm text-muted-foreground">{meta}</p>
          <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {FIT_FIELDS.map((field) => (
              <div key={field.key} className="rounded-lg bg-muted/70 px-2 py-1.5">
                <dt className="text-[11px] text-muted-foreground">{field.label}</dt>
                <dd className="text-sm font-medium">{score[field.key] as number}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-xs text-muted-foreground">
            Seniority fit {score.seniority_fit} · {assessmentLabel(score.seniority_assessment)}
          </p>
          <p className="mt-3 text-sm leading-6">{detailed ? opportunity.summary : score.reasoning}</p>
          {detailed ? (
            <div className="mt-4 space-y-3 text-sm leading-6">
              {opportunity.responsibilities.map((line) => (
                <p key={line}>{line}</p>
              ))}
              {opportunity.requirements.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          ) : (
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
              {opportunity.summary}
            </p>
          )}
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Why it matches
              </p>
              <ul className="mt-1 list-disc space-y-1 pl-4 text-sm leading-5">
                {score.strengths.slice(0, 3).map((item, index) => (
                  <li key={`${index}-${item}`}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Gaps
              </p>
              <ul className="mt-1 list-disc space-y-1 pl-4 text-sm leading-5">
                {score.gaps.slice(0, 3).map((item, index) => (
                  <li key={`${index}-${item}`}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
          {post?.application_instructions ? (
            <p className="mt-3 text-sm leading-6">
              <span className="font-medium">How to apply. </span>
              {post.application_instructions}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {opportunity.source === "HIRING_POST" ? (
              <a
                href={opportunity.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${buttonVariants()} h-10 px-4`}
              >
                View / Contact
              </a>
            ) : (
              <a
                href={opportunity.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${buttonVariants()} h-10 px-4`}
              >
                Apply
              </a>
            )}
            {isAppliedOrLater(history?.status) ? null : (
              <Button
                type="button"
                variant="outline"
                className="h-10 px-4"
                onClick={() => setJobStatus(profileId, opportunity.id, "applied")}
              >
                {opportunity.source === "HIRING_POST" ? "Mark as Contacted" : "Mark as Applied"}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              disabled={history?.status === "saved"}
              onClick={() => setJobStatus(profileId, opportunity.id, "saved")}
            >
              Save
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={history?.status === "not_interested"}
              onClick={() => setJobStatus(profileId, opportunity.id, "not_interested")}
            >
              Not interested
            </Button>
            {opportunity.source === "FORMAL_JOB" ? (
              <Link
                href={`/opportunities/${opportunity.id}`}
                className="text-sm font-medium text-muted-foreground underline-offset-4 hover:underline"
              >
                Details
              </Link>
            ) : null}
            {isAppliedOrLater(history?.status) ? (
              <label className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
                Outcome
                <select
                  className="border-input bg-background h-8 rounded-lg border px-2 text-sm text-foreground"
                  value={history?.status}
                  aria-label={`Outcome for ${opportunity.title}`}
                  onChange={(event) =>
                    setJobStatus(profileId, opportunity.id, event.target.value as JobAction)
                  }
                >
                  <option value="applied">
                    {opportunity.source === "HIRING_POST" ? "Contacted" : "Applied"}
                  </option>
                  {OUTCOME_ACTIONS.filter((action) => action !== "applied").map((action) => (
                    <option key={action} value={action}>
                      {actionLabel(action)}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
