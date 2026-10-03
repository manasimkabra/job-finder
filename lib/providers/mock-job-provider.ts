import { jobs } from "@/data/catalog";
import { jobToOpportunity } from "@/lib/providers/map-opportunity";
import type { DiscoveryProvider } from "@/lib/providers/types";

export const mockJobProvider: DiscoveryProvider = {
  source: "FORMAL_JOB",
  list() {
    return jobs.map(jobToOpportunity);
  },
};
