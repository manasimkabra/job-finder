import { catalogHiringPosts } from "@/data/catalog";
import { postToOpportunity } from "@/lib/providers/map-opportunity";
import type { DiscoveryProvider } from "@/lib/providers/types";

export const mockHiringPostProvider: DiscoveryProvider = {
  source: "HIRING_POST",
  list() {
    return catalogHiringPosts().map(postToOpportunity);
  },
};
