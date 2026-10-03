import type {
  EmploymentType,
  InboxView,
  JobAction,
  SeniorityAssessment,
  WorkArrangement,
} from "@/lib/domain/types";

export function arrangementLabel(value: WorkArrangement): string {
  if (value === "on-site") return "On-site";
  if (value === "hybrid") return "Hybrid";
  return "Remote";
}

export function employmentLabel(value: EmploymentType): string {
  if (value === "full-time") return "Full-time";
  if (value === "contract") return "Contract";
  return "Internship";
}

export function money(value?: number): string | null {
  if (value == null) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function salaryLabel(min?: number, max?: number): string {
  const low = money(min);
  const high = money(max);
  if (low && high) return `${low}–${high}`;
  if (low) return `From ${low}`;
  if (high) return `Up to ${high}`;
  return "Salary not listed";
}

export function assessmentLabel(value: SeniorityAssessment): string {
  if (value === "below_candidate_level") return "Below your level";
  if (value === "strong_fit") return "Strong fit";
  if (value === "reasonable_stretch") return "Reasonable stretch";
  return "Too senior";
}

export function actionLabel(action: JobAction): string {
  if (action === "shown") return "Shown";
  if (action === "saved") return "Saved";
  if (action === "applied") return "Applied";
  if (action === "not_interested") return "Not interested";
  if (action === "rejected") return "Rejected";
  if (action === "recruiter_response") return "Recruiter response";
  if (action === "interview") return "Interview";
  return "Offer";
}

export function viewMatches(view: InboxView, status: JobAction): boolean {
  if (view === "recommendations") return status === "shown";
  if (view === "saved") return status === "saved";
  if (view === "applied") return status === "applied";
  if (view === "responses") return status === "recruiter_response";
  if (view === "interviews") return status === "interview";
  if (view === "skipped") return status === "not_interested";
  return status === "rejected" || status === "offer";
}

export const VIEW_LABELS: { id: InboxView; label: string }[] = [
  { id: "recommendations", label: "Recommended Opportunities" },
  { id: "saved", label: "Saved" },
  { id: "applied", label: "Applied" },
  { id: "responses", label: "Responses" },
  { id: "interviews", label: "Interviews" },
  { id: "skipped", label: "Skipped" },
  { id: "archive", label: "Archive" },
];
