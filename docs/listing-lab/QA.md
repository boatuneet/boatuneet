# Verification record

Recorded 21 September 2026. This verifies implementation behavior; it is not a market-coverage or matching-accuracy benchmark.

## Automated

- All 38 core tests passed. They cover identity ambiguity, reported HIN conflicts, shared-ad namespace rules, locale grouping, candidate isolation, reversible decisions, tax/currency/offer exclusions, old observations, immutable history, safe imports, conservative extraction, CSV formula safety, and search provider error paths.
- TypeScript strict checking and the final production build passed. The local search endpoint returned the expected 503 (missing credential), 400 (invalid payload), and 403 (cross-origin request), all with no-store headers.
- The existing Google Sans Flex font produces a non-fatal fallback-metrics warning in Next.js. It does not prevent the build.
- No database or production waitlist tests were run because the POC does not touch that data path or load its credentials.

## Browser checks

Use the running local app and actual UI controls to verify:

- Real Sunseeker baseline: six advertisements, two linked including reference, four candidates and one grouped locale.
- Inspect candidate evidence; confirm and undo; counts recalculate.
- Synthetic price and hours edits remove discrepancies; previous observations remain in history.
- Page reload preserves the active report and observations.
- Missing search credential is explicit; guided search URLs remain available.
- Own-boat paste, extraction, save, duplicate-URL rejection and second-ad comparison.
- JSON download and import; malformed input is rejected without replacing the report.
- Small-screen and desktop layouts, modal keyboard dismissal, focus visibility and console errors.

### Outcomes

All of the interaction checks above passed through the Codex in-app browser. The own-boat test ran on the separate `localhost` origin to keep the handoff report at `127.0.0.1` free of QA-only personal records.

- Pasted facts extracted EUR 289,000 correctly; a duplicate source URL was rejected in the form. A second same-HIN advertisement at EUR 300,000 generated an EUR 11,000 gap.
- The actual JSON export was downloaded to disk and imported through the file chooser. The report retained both observations and the calculated gap, and appeared as a separate copy. The browser's download-event listener timed out, but the file existed and its successful UI import verified the output.
- An unsupported-version JSON file produced an understandable error without replacing the active report.
- Feedback saved; Escape closed the native dialog. Opening evidence on mobile focused the panel and scrolled it into view.
- At an actual 375 CSS-pixel viewport, document width and scroll width were both 375; all four navigation buttons fit in two rows with 44-pixel heights. At 812 × 375 landscape, document and scroll widths both remained 812. Additional desktop visual checks showed readable, intact cards and evidence panels.
- Browser console checks returned no application errors. The Lab DOM contained no Google Tag Manager or Vercel Analytics script.
- Reduced-motion styles are implemented. An OS-level reduced-motion preference was not changed during testing. Native print-to-PDF output was not separately visually inspected.
- Main checkout remained on `main`, retaining its pre-existing deletion of `public/coming-soon-video.mp4`. The POC is in a separate worktree and branch. Launch page component, page and global stylesheet are unchanged in the POC; the shared layout wraps analytics so the Lab does not load them.

## Unverified externally

- No available Brave credential: successful live-provider access is unverified. Mocked provider responses and the real disconnected endpoint are tested.
- No marketplace agreements/feed credentials: automated cross-marketplace discovery, completeness, availability and refresh cadence are unverified and are not claimed in the UI.
- No owner-confirmed physical identity for the supplied Sunseeker beyond its reference URL. Research candidates remain provisional.
