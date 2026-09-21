export type Offer = "whole" | "fractional" | "charter" | "unknown";
export type Currency = "EUR" | "GBP" | "USD" | "unknown";
export type Tax = "included" | "excluded" | "unknown";
export type Origin = "research" | "manual" | "synthetic";
export type ListingStatus = "advertised" | "unknown" | "removed" | "sold";
export type Decision = "confirm" | "reject";

export interface BoatFacts {
  make: string;
  model: string;
  year: number | null;
  hin: string;
  boatName: string;
  location: string;
  seller: string;
  engine: string;
  hours: number | null;
  price: number | null;
  currency: Currency;
  priceKind: "asking" | "converted" | "unknown";
  tax: Tax;
  offer: Offer;
  shares: number | null;
  narrativeShares: number | null;
}
export interface Snapshot {
  origin: Origin;
  capturedAt: string;
  observedAt: string;
  data: BoatFacts;
  status: ListingStatus;
  note: string;
}
export interface Listing {
  id: string;
  url: string;
  data: BoatFacts;
  observedAt: string;
  capturedAt: string;
  origin: Origin;
  status: ListingStatus;
  note: string;
  history: Snapshot[];
}
export interface PilotFeedback {
  useful: "yes" | "no" | "unsure";
  nextAction: "clarify" | "correct" | "monitor" | "none";
  note: string;
  recordedAt: string;
}
export interface Workspace {
  version: 1;
  id: string;
  name: string;
  kind: "research" | "synthetic" | "personal";
  referenceId: string;
  listings: Listing[];
  decisions: Record<string, Decision>;
  resolved: string[];
  feedback: PilotFeedback | null;
}
export interface Match {
  listing: Listing;
  band: "reference" | "strong" | "review" | "excluded";
  reason: string;
  evidence: string[];
  conflicts: string[];
  decision?: Decision;
  hardConflict: boolean;
  aliases: Listing[];
}
export interface Finding {
  id: string;
  severity: "attention" | "context";
  title: string;
  detail: string;
  action: string;
  listingIds: string[];
}
export const emptyFacts = (): BoatFacts => ({
  make: "",
  model: "",
  year: null,
  hin: "",
  boatName: "",
  location: "",
  seller: "",
  engine: "",
  hours: null,
  price: null,
  currency: "unknown",
  priceKind: "asking",
  tax: "unknown",
  offer: "unknown",
  shares: null,
  narrativeShares: null,
});
