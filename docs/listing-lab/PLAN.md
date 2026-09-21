# UNEET Listing Lab — investigation and POC plan

Date: 21 September 2026. Branch: `poc/listing-intelligence`.

## Decision

Build an evidence-first **listing audit** for an owner or representative with an existing advertisement. Test whether the report reveals an actionable issue before investing in automated marketplace coverage. The existing home page stays at `/`; the POC lives at `/lab` in a separate checkout.

## Plausible variations

| Direction            | User outcome                                           | Smallest useful test                                        | Main uncertainty                                             | Decision                                                                        |
| -------------------- | ------------------------------------------------------ | ----------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Exact-boat finder    | Discover unknown advertisements                        | Known boat + cross-source candidate search                  | Source access and identifying evidence                       | Include guided discovery, optional search API; do not promise exhaustive search |
| Listing audit        | Understand inconsistent advertisements and offer terms | Compare supplied adverts with reversible identity decisions | Will owners act on findings?                                 | Build now                                                                       |
| Sale-readiness check | Prepare a complete sale pack before listing            | Check owner materials against a disclosure checklist        | Requires a different user cohort; little identity validation | Defer; lightweight missing-field observations only                              |
| Broker monitoring    | Know what changed since the last check                 | Repeated snapshots and an owner-facing change log           | Recurring access, operational cost, willingness to pay       | Include manual history; defer scheduled monitoring                              |

The chosen variation tests identity resolution and owner value without hiding data-access limitations. No valuation, predicted selling time, automatic broker contact, or claimed market-wide coverage.

## Research findings and sources

1. Boat24 already offers new-listing notifications and favorites. Generic search alerts are weak differentiation: https://www.boat24.com/en/about/facts/
2. YachtWorld also offers saved-search alerts: https://www.yachtworld.com/?locale=en_US
3. Boats Group has an authenticated inventory API; access and use rights must be agreed, not inferred from documentation: https://api.boats.com/docs/overview and https://www.boatsgroup.com/boats-group-international-service-agreement-english/
4. Boats Group's public terms restrict extraction and republication. No marketplace crawler is included: https://www.boatsgroup.com/terms-of-use/
5. Optional Brave Search discovers indexed URLs; it does not verify current listing status. Results remain transient; they are not saved into reports automatically. Storage rights depend on the plan: https://brave.com/search/api/ and https://api-dashboard.search.brave.com/documentation/resources/terms-of-service

## User-provided real case

Starting URL: https://www.yachtworld.com/yacht/2021-sunseeker-76-yacht-10027876/

Research accessed 21 September 2026 through web search/page extraction. Pages may be indexed snapshots; access date is not a live availability check. Only compact factual observations and original analyst summaries are stored, not copied descriptions or photos. This is a manually researched case, not evidence of an operational source adapter.

- The Miami offer is a fractional share, with six annual weeks of use, not a whole-vessel sale. YachtWorld displayed USD 682,371; its UK version displayed GBP 510,000. These are not treated as two independent advertisements or proof of a pricing error.
- boats.com uses the same Boats Group advertisement ID, `10027876`. It lists original GBP 510,000 and structured `Fractional Shares = 8`; its narrative describes six co-owners. Report these differing counts as offer terms requiring clarification; shares and owner counts are not necessarily equivalent, not a fraud allegation.
- Next Generation Yachting's Miami listing `/195893` publishes HIN `GBXSK07255B020`, 700 hours, the same engine model and fractional offer. The reference page did not expose that HIN in the retrieved text. Keep the candidate unconfirmed; do not silently promote its HIN to owner truth.
- Machinio lists stock number `10027876`. Cross-site stock-number equality is supporting evidence, not a universal identity key.
- The Nice advertisement `10027793` has the same make/model/year, seller and share price but a different listing ID and location. Keep it unconfirmed.
- A full-vessel Aventura listing at USD 3,695,000 is a lookalike candidate, not a price comparison or automatically the owner's boat.

Evidence URLs are embedded alongside every research observation. No claim of market-wide completeness, current availability or proven ownership.

## Implementation

1. Typed listing observations, source provenance, reference selection, local workspace schema and validated JSON import/export.
2. Deterministic identity rules with human-readable evidence. Make/model/year never proves identity. Hard HIN conflicts require correction, not automatic merging. Known Boats Group ad IDs are namespaced. Localized versions collapse only within the same platform.
3. Price comparison only within known offer basis, currency and tax status; fractional offers also require consistent share terms. Converted displays, unknown bases, stale observations and unresolved candidates do not create price-gap claims.
4. Reversible owner decisions, listing edits with preserved snapshots, meaningful findings and local pilot feedback.
5. Responsive workspace with real research case, explicitly synthetic edge-case scenario and a blank own-boat path. No external persistence or user messages. Browser-local storage with export and visible save failures.
6. Guided search links work without credentials. Optional server-side Brave API returns transient URL leads with missing-key, timeout and rate-limit states. No arbitrary URL fetch or marketplace scraping.

## Test plan / acceptance

- Engine tests: false positives, HIN normalization/conflicts, model ambiguity, namespaced IDs, localized deduplication, no transitive identity promotion, reversible decisions.
- Audit tests: fractional vs whole vessel, unknown tax/offer terms, mixed currencies, display conversions, missing values, stale snapshots, zero results.
- Import/parser tests: invalid URLs, malformed JSON, bounded sizes, European prices, ambiguous dollar currency, no silent invented fields, duplicate observations and history.
- Browser test: open research case, inspect findings/evidence, confirm and undo candidate, edit listing, see history, reload persisted case, own-boat creation, import/export, empty states, mobile layout, keyboard focus and reduced motion.
- TypeScript and production build. Verify original launch files unchanged.

## Pilot decision gate (proposed, not validated targets)

Use 15–20 owner-confirmed boats in one segment. Measure: known-listing recovery within declared coverage, incorrect strong links, report preparation minutes, reports with a previously unknown material issue, and owners requesting a next action. Pause automated expansion if credible access to core sources cannot be secured or reports consistently reveal nothing owners care about. Do not use synthetic or researcher-confirmed cases as accuracy validation.

## Limits

No production authentication, shared database, scheduler, browser photo comparison, feed agreement, valuation, or calibrated probability model. Optional live search requires a separately provisioned credential and must be integration-tested with that account. This POC validates the report workflow and deterministic safeguards; it cannot establish market coverage or demand by itself.
