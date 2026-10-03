import { mockHiringPostProvider } from "@/lib/providers/mock-hiring-post-provider";
import { mockJobEvaluator } from "@/lib/providers/mock-evaluator";
import { mockJobProvider } from "@/lib/providers/mock-job-provider";
import type { DiscoveryProvider, JobEvaluator } from "@/lib/providers/types";

export function getDiscoveryProviders(): DiscoveryProvider[] {
  return [mockJobProvider, mockHiringPostProvider];
}

export function getJobEvaluator(): JobEvaluator {
  return mockJobEvaluator;
}
