# BoatUneet Final Chapter Refinement — Design QA

- User references:
  - `/var/folders/5r/qmvcrqk52fsf3qj1b8nypmvr0000gn/T/TemporaryItems/NSIRD_screencaptureui_fvENRf/Screenshot 2026-08-11 at 18.40.52.png`
  - `/var/folders/5r/qmvcrqk52fsf3qj1b8nypmvr0000gn/T/TemporaryItems/NSIRD_screencaptureui_Lr9NKM/Screenshot 2026-08-11 at 18.42.55.png`
- Final browser captures:
  - `/Users/eimantaskudarauskas/.codex/visualizations/2026/08/11/019ff04a-60e4-7730-b803-051c930ef846/37-final-card-dock.jpg`
  - `/Users/eimantaskudarauskas/.codex/visualizations/2026/08/11/019ff04a-60e4-7730-b803-051c930ef846/38-final-card-exact.jpg`
- Combined comparison evidence:
  - `/Users/eimantaskudarauskas/.codex/visualizations/2026/08/11/019ff04a-60e4-7730-b803-051c930ef846/41-final-card-card-comparison.jpg`
- Desktop viewports: 1510 × 861 and 1556 × 1106 CSS px.
- Mobile viewport: 390 × 844 CSS px.
- State: questions chapter with the second FAQ expanded and final navigation visible.

## Findings and fixes

- [P1] The final chapter ended twice: once in the page footer and once in the floating chapter rail.
  - Fix: removed the logo/legal/back-to-top footer and retained a single persistent chapter rail.
- [P1] The final rail still announced a non-existent next chapter.
  - Fix: on chapter five it now targets `#intro`, labels the action “Back to top,” uses an upward arrow, and exposes a descriptive accessible name.
- [P1] Returning to the first chapter did not replay its text entrance.
  - Fix: the GSAP hero line timeline now restarts on backward entry to Intro; other chapter timelines continue to reset and replay in both directions.
- [P1] The early-access card had oversized copy and a narrow form floating inside a much larger navy surface.
  - Fix: created a compact editorial header grid, reduced the title scale, placed the signup controls inside a bordered inner panel, and removed the form's desktop max-width so the progress bar, field, and button share one alignment system.
- [P1] FAQ expansion could not move the right card or fixed dock.
  - Verification: before and after opening the second FAQ, the card remained at x 703.72 / y 108.11 / 743.28 × 464.59 and the dock remained at x 165 / y 787 / 1180 × 56.

## Interaction and responsive checks

- Final “Back to top” action reached scrollY 0, changed the hash to `#intro`, and restored the Intro/Continue dock state.
- FAQ buttons retained animated open/close behavior and correct `aria-expanded` state.
- Desktop card and dock have clear separation with 110px of reserved chapter padding.
- At 390px width, the final card is 350px wide, the desktop dock is hidden as intended, and horizontal overflow is 0px.
- `prefers-reduced-motion` behavior remains intact.
- Production build, TypeScript compilation, database tests, and `git diff --check` passed.

## Comparison result

The focused before/after comparison shows that the revised card uses its width intentionally: title and supporting copy form a balanced top row, while capacity, form controls, and privacy copy align inside a single contained panel. The redundant footer is absent and the final rail now completes the same chapter-navigation system used throughout the page.

No actionable P0, P1, or P2 issues remain in this focused pass.

## Final dock state correction

- User reference: `/var/folders/5r/qmvcrqk52fsf3qj1b8nypmvr0000gn/T/TemporaryItems/NSIRD_screencaptureui_s2INKP/Screenshot 2026-08-11 at 18.59.08.png`.
- Final capture: `/Users/eimantaskudarauskas/.codex/visualizations/2026/08/11/019ff04a-60e4-7730-b803-051c930ef846/42-compact-final-dock.jpg`.
- Combined comparison: `/Users/eimantaskudarauskas/.codex/visualizations/2026/08/11/019ff04a-60e4-7730-b803-051c930ef846/44-dock-before-after.jpg`.
- Reduced the desktop rail from a 1180px to 1100px maximum width and increased responsive side gutters from 32px to 48px.
- Replaced the narrow IntersectionObserver activation band with a requestAnimationFrame-throttled scroll-position marker plus an explicit page-end fallback.
- Verified direct `#questions` navigation and forward scrolling both produce: current chapter `05 Questions`, five filled progress tracks, target `#intro`, and action label `Back to top`.
- Verified the final action retains its 44px minimum target and accessible label.

## Continuous-scroll timing correction

- User reference: `/var/folders/5r/qmvcrqk52fsf3qj1b8nypmvr0000gn/T/TemporaryItems/NSIRD_screencaptureui_Vup7mC/Screenshot 2026-08-11 at 19.21.49.png`.
- Final capture: `/Users/eimantaskudarauskas/.codex/visualizations/2026/08/11/019ff04a-60e4-7730-b803-051c930ef846/45-final-line-border.jpg`.
- Combined comparison: `/Users/eimantaskudarauskas/.codex/visualizations/2026/08/11/019ff04a-60e4-7730-b803-051c930ef846/46-line-border-comparison.jpg`.
- Corrected the requestAnimationFrame throttle so continuous wheel/trackpad events cannot cancel the pending active-chapter update.
- Added an independent GSAP chapter-state trigger while retaining the earlier reveal-animation trigger positions.
- Verified a continuous smooth scroll into chapter five resolves to `05 Questions`, five fully scaled progress segments, and `Back to top`.
- Verified the dock border computes to `1px solid rgb(226, 232, 240)`.

## Typography and final CTA hierarchy

- User references:
  - `/var/folders/5r/qmvcrqk52fsf3qj1b8nypmvr0000gn/T/TemporaryItems/NSIRD_screencaptureui_7XnwsG/Screenshot 2026-08-11 at 19.36.40.png`
  - `/var/folders/5r/qmvcrqk52fsf3qj1b8nypmvr0000gn/T/TemporaryItems/NSIRD_screencaptureui_GSwyPV/Screenshot 2026-08-11 at 19.37.24.png`
  - `/var/folders/5r/qmvcrqk52fsf3qj1b8nypmvr0000gn/T/TemporaryItems/NSIRD_screencaptureui_Aw0Fzr/Screenshot 2026-08-11 at 19.38.15.png`
- Final capture: `/Users/eimantaskudarauskas/.codex/visualizations/2026/08/11/019ff04a-60e4-7730-b803-051c930ef846/47-type-cta-dock.jpg`.
- CTA comparison: `/Users/eimantaskudarauskas/.codex/visualizations/2026/08/11/019ff04a-60e4-7730-b803-051c930ef846/50-cta-before-after.jpg`.
- Wordmark close-up: `/Users/eimantaskudarauskas/.codex/visualizations/2026/08/11/019ff04a-60e4-7730-b803-051c930ef846/48-wordmark-closeup.jpg`.
- Replaced the split title/subtitle header with one stacked 660px text column; the form remains a separate aligned panel below it.
- Reduced the CTA title scale and loosened its line height so the message reads in two natural lines at desktop width.
- Changed the wordmark pairing from Playfair Display / Geist to Cormorant Garamond / Montserrat and reduced the tracking tension between the two names.
- The final Back to top button now measures 131px with 18px left padding, 14px right padding, a 10px text/icon gap, and a fixed 17px icon.
- Mobile verification at 390px: no horizontal overflow, 350px card width, and stable title/wordmark wrapping.
- Final wordmark adjustment: both `Boat` and `Uneet` now render in Montserrat 700 with identical normal style and tracking; only their color differs.

final result: passed
