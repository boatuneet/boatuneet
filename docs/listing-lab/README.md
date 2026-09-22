# Try UNEET Listing Lab

This is a working **listing audit POC**, not a production boat search engine. It lives at `/lab` on `main` (originally developed on `poc/listing-intelligence`). The original launch page stays at `/`.

## Start locally

From this checkout:

```sh
npm ci
npm run dev:lab
```

Open **http://127.0.0.1:3100/lab**. No database, login or API key is needed. Use the same hostname each time: `localhost` and `127.0.0.1` have separate browser storage. Reports also remain separate between browsers.

For a production-mode local preview:

```sh
npm run build
npm run start -- --hostname 127.0.0.1 --port 3100
```

Stop the dev server before starting production on the same port. Requires Node 22.18+ for native TypeScript test stripping (developed and verified with Node 26.5.0).

## A five-minute walkthrough

1. **Sunseeker 76 → Boat report.** Your supplied YachtWorld URL is the reference. Expect six advertisements, one grouped localized version, two linked advertisements including the reference, and four candidates needing review. Read the fractional-offer finding and the different counts of eight shares and six co-owners (these terms are not necessarily equivalent). These are manually researched observations from 21 September 2026, not a new web search.
2. **Advertisements → Next Generation Yachting / Miami.** Inspect its reported HIN and supporting details. That HIN is not known on the reference. Link it manually and watch the counts change; undo the decision to restore the evidence-only result. The Nice and Aventura advertisements remain separate until reviewed.
3. **Axopar 37 → Boat report.** This is synthetic. Two matching reported HINs expose a EUR 16,000 asking-price difference and conflicting engine hours. A lookalike with a different HIN stays excluded. A similar boat without a HIN stays unconfirmed.
4. **Edit the synthetic linked advertisement.** Change price from 305000 to 289000 and hours from 190 to 240. Save. The corresponding discrepancies disappear; Observation history retains the previous values. Change them back to repeat the test.
5. **Your own boat.** Saved boats appear by name under **Your reports** in the sidebar. **Add another boat** starts a separate report; an unfinished empty report is reused. Add a reference URL and paste labelled details using the example below. Review the extracted fields, especially currency and offer basis, before saving. Add another advertisement with a different URL. Use the guided searches under Find more listings to find candidates externally, then record what you observed.
6. **Export / Import.** Export JSON, then import it through the footer. Import creates a separate copy rather than overwriting the report. CSV exports flat observations; browser print can save the overview to PDF. A [synthetic import example](../../public/lab/example-import.json) is also available from the export dialog.
7. **About this experiment.** Review the four product directions and record usefulness / intended next action. Feedback stays local and is included in JSON exports. No messages are sent.

### Paste example

These are invented test values; do not use them as facts about the Sunseeker.

```text
Make: Axopar
Model: 37 XC Cross Cabin
Year: 2023
HIN: FI-AXO7C123A323
Boat name: Northern Light
Location: Split, Croatia
Seller: Example Marine
Engine model: Mercury V8 300
Engine hours: 240
Price: EUR 289,000
Offer: whole vessel
VAT: included
```

The extractor is deliberately label-based and conservative, not an AI parser. Plain `$` does not establish USD. It does not infer whole-vessel ownership from an ordinary price. A URL alone is not fetched. Unknown facts remain unknown.

## Optional live URL discovery

If you already have an appropriately authorized Brave Search subscription, add the following to this checkout's untracked `.env.local`, then restart the server:

```text
BRAVE_SEARCH_API_KEY=your-server-side-key
```

This is optional. No credential was available during development, so the live provider was validated with mocked responses and the real missing-key HTTP path, **not a paid live-provider call**.

The app sends the explicit query to Brave only when Search web is clicked. The key stays server-side. Results are transient and are never automatically persisted into a report, scored as matches, or used as facts. Open a result and add your own observation. The API has a 10-second upstream timeout, a 10-request/minute process-local limit and is restricted to local hostnames for this POC. It is not a production security boundary or a public API. No arbitrary-URL fetching, scraping, bot bypass, marketplace feed or background monitoring is implemented.

## Persistence and boundaries

- Browser-local storage only. No Supabase writes, accounts, emails, shared reports or background jobs. The Lab skips loading production marketing analytics.
- A report can hold 200 observations. Each listing keeps 30 prior snapshots. The browser supports up to 12 reports within a 4 MB total storage limit. JSON import is capped at 1 MB.
- Exports are the backup mechanism. Private browsing, storage quotas or browser clearing can lose local data; failures are shown. Invalid stored reports are left intact rather than silently overwritten.
- Existing source URLs are immutable to preserve history attribution. Add a new advertisement for a different URL.
- Source edits invalidate the corresponding manual match decision and all reviewed findings. Changing reference facts invalidates all manual identity decisions.
- Strong links are rules with visible evidence, not calibrated probabilities or proof of vessel ownership. No transitive identity propagation.
- Locale grouping is limited to the same known platform and advertisement ID. Marketplace ownership is never used to claim unique buyer reach.
- Price gaps require linked, recent, advertised observations with known matching currency, whole-vessel offer and tax basis. Converted prices and unresolved candidates are excluded. Fractional and charter gaps are deferred because their rights/periods are not normalized.
- The POC treats reported HIN/CIN as evidence; it does not validate registration, title or manufacturer databases. Similar model names may require manual review.
- Observed dates are not last-live-checked dates. Source status is a recorded claim. A missing result is not a removal or sale.
- Manually researched case facts are compact observations with source URLs. No third-party photographs or full listing descriptions are bundled.

## Development checks

```sh
npm run test:lab
npx tsc --noEmit
npm run build
```

See [PLAN.md](PLAN.md) for options, external research, implementation decisions and proposed pilot gates. See [QA.md](QA.md) for the verification record and remaining limits.
