export type LocationOption = {
  id: string;
  label: string;
  /** A search scope, not a city a job is pinned to. */
  scope?: boolean;
};

export const LOCATION_OPTIONS: LocationOption[] = [
  { id: "new-york", label: "New York, NY" },
  { id: "sf-bay", label: "San Francisco Bay Area" },
  { id: "los-angeles", label: "Los Angeles, CA" },
  { id: "boston", label: "Boston, MA" },
  { id: "chicago", label: "Chicago, IL" },
  { id: "austin", label: "Austin, TX" },
  { id: "seattle", label: "Seattle, WA" },
  { id: "remote-us", label: "Remote - US" },
  { id: "anywhere-us", label: "Anywhere in United States", scope: true },
];

export function locationLabel(id: string): string {
  return LOCATION_OPTIONS.find((option) => option.id === id)?.label ?? id;
}

export function locationIdsFromLabel(label?: string): string[] {
  if (!label) return [];
  const match = LOCATION_OPTIONS.find(
    (option) => !option.scope && (option.label === label || label.includes(option.label)),
  );
  return match ? [match.id] : [];
}

/**
 * City picks are OR'd. "Anywhere in United States" matches every US listing
 * and does not let a simultaneous city pick narrow the set.
 */
export function locationMatches(jobLocationIds: string[], selected: string[]): boolean {
  if (selected.length === 0) return true;
  if (selected.includes("anywhere-us")) return true;
  return jobLocationIds.some((id) => selected.includes(id));
}
