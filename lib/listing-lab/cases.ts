import { emptyFacts } from "./types.ts";
import type { BoatFacts, Listing, Workspace } from "./types.ts";

const observedAt = "2026-09-21T17:03:00.000Z";
function observed(
  id: string,
  url: string,
  data: Partial<BoatFacts>,
  note: string,
  origin: Listing["origin"] = "research",
): Listing {
  return {
    id,
    url,
    data: { ...emptyFacts(), ...data },
    note,
    observedAt,
    capturedAt: observedAt,
    origin,
    status: "advertised",
    history: [],
  };
}
const sunseeker: Partial<BoatFacts> = {
  make: "Sunseeker",
  model: "76 Yacht",
  year: 2021,
  location: "Miami, Florida",
  seller: "Yacht Share Limited",
  engine: "MAN V12-1550",
  hours: 700,
  offer: "fractional",
  narrativeShares: 6,
};
export function researchCase(): Workspace {
  return {
    version: 1,
    id: "sunseeker-research",
    name: "Sunseeker 76 Yacht",
    kind: "research",
    referenceId: "sun-yw",
    decisions: {},
    resolved: [],
    feedback: null,
    listings: [
      observed(
        "sun-yw",
        "https://www.yachtworld.com/yacht/2021-sunseeker-76-yacht-10027876/",
        {
          ...sunseeker,
          price: 682371,
          currency: "USD",
          priceKind: "converted",
        },
        "User-provided starting advertisement. Retrieved page displayed USD 682,371; the UK version of the same ad displayed GBP 510,000. Offer is an equity share with six weeks of annual use. No HIN was exposed in the retrieved reference text. Research snapshot, not a live availability check.",
      ),
      observed(
        "sun-boats",
        "https://www.boats.com/power-boats/2021-sunseeker-76-yacht-10027876/",
        { ...sunseeker, price: 510000, currency: "GBP", shares: 8 },
        "Original asking currency shown as GBP. Structured data records eight fractional shares; narrative describes six co-owners. Same network advertisement ID as the reference. Terms need clarification.",
      ),
      observed(
        "sun-uk",
        "https://www.yachtworld.co.uk/yacht/2021-sunseeker-76-yacht-10027876/",
        { ...sunseeker, price: 510000, currency: "GBP" },
        "Localized YachtWorld version of advertisement 10027876. Keep as price provenance, not an extra independent advertisement.",
      ),
      observed(
        "sun-ng",
        "https://www.ngyachting.com/yacht-sales/2021-sunseeker-76-yacht-miami-florida-for-sale/195893",
        {
          ...sunseeker,
          price: 692835,
          currency: "USD",
          priceKind: "unknown",
          seller: "Next Generation Yachting",
          hin: "GBXSK07255B020",
        },
        "Miami candidate with matching engine model, 700 hours and fractional offer. This page publishes a HIN, but the reference does not expose one: identity remains unconfirmed. Displayed USD amount is treated as a possible conversion, not a verified original ask.",
      ),
      observed(
        "sun-machinio",
        "https://www.machinio.com/listings/118075696-2021-sunseeker-76-yacht-in-miami-fl",
        {
          make: "Sunseeker",
          model: "76 Yacht",
          year: 2021,
          location: "Miami, Florida",
          engine: "MAN V12-1550",
        },
        "Search-index observation: stock number 10027876, matching engine model and Miami location. Price, offer terms and current availability were not established. A stock number is supporting evidence, not a universal vessel identifier.",
      ),
      observed(
        "sun-nice",
        "https://www.boats.com/power-boats/2021-sunseeker-76-yacht-10027793/",
        {
          ...sunseeker,
          location: "Nice, France",
          hours: null,
          narrativeShares: null,
          price: 510000,
          currency: "GBP",
          shares: 8,
        },
        "Same model, year, advertiser and share price, but a different advertisement ID and location. This could be another vessel or another offer; do not merge based on price or seller alone.",
      ),
      observed(
        "sun-aventura",
        "https://www.ngyachting.com/yacht-sales/2021-sunseeker-76-yacht-aventura-florida-for-sale/178357",
        {
          make: "Sunseeker",
          model: "76 Yacht",
          year: 2021,
          location: "Aventura, Florida",
          seller: "Next Generation Yachting",
          engine: "MAN",
          price: 3695000,
          currency: "USD",
          offer: "whole",
        },
        "Lookalike candidate advertised as a whole-vessel sale. A 1,000-hour service is mentioned, which is not the same as an observed current engine-hour value. Neither physical identity nor comparability to the fractional reference is established.",
      ),
    ].map((l) =>
      l.id === "sun-machinio" ? { ...l, status: "unknown" as const } : l,
    ),
  };
}
export function syntheticCase(): Workspace {
  const facts: Partial<BoatFacts> = {
    make: "Axopar",
    model: "37 XC Cross Cabin",
    year: 2023,
    hin: "FI-AXO7C123A323",
    boatName: "Northern Light",
    location: "Split, Croatia",
    seller: "Example Marine",
    engine: "Mercury V8 300",
    hours: 240,
    price: 289000,
    currency: "EUR",
    tax: "included",
    offer: "whole",
  };
  const make = (id: string, data: Partial<BoatFacts>, note: string) =>
    observed(
      id,
      `https://${id}.example.com/listing/axopar-37`,
      { ...facts, ...data },
      `SYNTHETIC TEST DATA. ${note}`,
      "synthetic",
    );
  return {
    version: 1,
    id: "synthetic-axopar",
    name: "Axopar discrepancy test",
    kind: "synthetic",
    referenceId: "demo-reference",
    decisions: {},
    resolved: [],
    feedback: null,
    listings: [
      make("demo-reference", {}, "The chosen reference."),
      make(
        "demo-linked",
        { hin: "FI AXO7C123A323", price: 305000, hours: 190 },
        "Same reported HIN; different asking price and hours.",
      ),
      make(
        "demo-lookalike",
        { hin: "FI-AXO8D456B323", price: 260000 },
        "Different HIN. Must be excluded, even though other details agree.",
      ),
      make(
        "demo-ambiguous",
        { hin: "", boatName: "", price: 275000 },
        "Make, model and year alone must not trigger a strong link.",
      ),
    ],
  };
}
export function blankWorkspace(): Workspace {
  return {
    version: 1,
    id: "personal",
    name: "My boat report",
    kind: "personal",
    referenceId: "",
    listings: [],
    decisions: {},
    resolved: [],
    feedback: null,
  };
}
