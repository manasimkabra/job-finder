import type {
  JobScore,
  Opportunity,
  Profile,
  SourceType,
} from "@/lib/domain/types";

export interface DiscoveryProvider {
  readonly source: SourceType;
  list(): Opportunity[];
}

export interface JobEvaluator {
  readonly scoringVersion: string;
  evaluate(profile: Profile, opportunity: Opportunity): JobScore;
}
