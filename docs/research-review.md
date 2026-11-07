# Research and engineering review

This repo is a product, not a study: a static one-page portfolio site (`index.html`, `style.css`, `script.js`) built for a client. There is no research question, data or experiment, so the PhD-style rubric is adapted to engineering rigor. Each row below records the grade before this branch, what was fixed cheaply, and what any remaining gap needs.

Every number quoted here is produced by `site/scripts/extract.mjs` or `site/src/audit.check.mjs` from the repo files. Run `cd site && npm ci && npm test` to reproduce them.

## Overall

| | Before this branch | After |
|---|---|---|
| Overall | C+ | B- |

The site works: it has no console errors, no horizontal overflow at 390px or 1440px, and all 6 nav anchors resolve. The weak areas were accessibility, testing, deployment and two content faults that only the site's owner can settle.

## Rubric

| Criterion | Before | After | Evidence and remaining gap |
|---|---|---|---|
| Question / purpose | B | B | Clear purpose: present one person's experience and contact details. No stated audience or success measure (for example, contact clicks). **Needs:** the owner's goal for the site, plus an analytics choice that the subject agrees to. |
| Hypotheses | n/a | n/a | No claims to test. The product equivalent is the requirement "a visitor can reach the owner". That requirement currently fails (see Correctness). |
| Method / craft | B | B | Hand-written HTML and CSS with 6 sections, 1 breakpoint (`max-width: 768px`), 2 keyframe animations and 2 CDN stylesheets. Simple and readable, with no build step. |
| Baselines / comparison | n/a | n/a | No alternative design was measured. **Needs:** a Lighthouse run in CI to compare against later changes. It is cheap, but it needs a headless Chrome step and a baseline decision from the owner. |
| Statistics / uncertainty | n/a | n/a | No measurements. Contrast ratios are exact values from the WCAG 2.x formula, checked against WebAIM reference values (for example `#007bff` on white gives 3.98:1). |
| Correctness | B | B | Works in Chromium at both widths. **Open fault:** `mailto:aramide.bb@example.com` uses a reserved placeholder domain, so the main call to action cannot reach anyone. **Needs:** the real address from the owner. It was not guessed. |
| Content truthfulness | C | C | The About text says "over 10 years", the timeline says "Over 9 years", and the dated role (Dec 2016 - Jan 2026) is 109 months, about 9.1 years. **Needs:** the owner's correct wording. The dashboard reports the inconsistency as an open finding. |
| Accessibility | D | B- | **Fixed:** the burger menu is now a `<button>` with `aria-label`, and `aria-expanded` is kept in sync by `script.js`. The 6 Font Awesome icons are `aria-hidden`. **Remaining:** 5 of the 14 rendered text/background pairs fall below 4.5:1, for example `.btn.primary` at 3.98:1 and `.edu-card .date` (`#888`) at 3.54:1. Fixing them means changing the client's palette, which is a design decision for the owner. Also needs a screen-reader pass (NVDA or VoiceOver, about 30 minutes, manual). |
| Security / hygiene | C | B | **Fixed:** the `target=_blank` LinkedIn link now has `rel="noopener noreferrer"`. **Remaining:** Font Awesome 6.0.0 loads from cdnjs without an `integrity` hash. **Needs:** the SRI hash from cdnjs's published metadata, added with `crossorigin="anonymous"`, or a self-hosted copy. |
| SEO / sharing | D | C | **Fixed:** a meta description, reusing the hero text already on the page. **Remaining:** no Open Graph tags, no favicon. **Needs:** a share image and title approved by the owner. |
| Reproducibility | C | A- | No build to reproduce; the site opens from the file system. The dashboard build is pinned (`react@18.3.1`, `vite@6.4.5`) and copies the site byte for byte. |
| Testing | F | B | **Fixed:** `site/src/audit.check.mjs` asserts the page structure (6 sections, 6/6 anchors, a single h1, lang, viewport), regression-tests the accessibility and `rel` fixes, checks that the audit still flags the pre-fix markup, and checks contrast and date arithmetic against known answers. It runs in every `npm run build`. **Remaining:** no browser test of the burger toggle in CI. **Needs:** a Playwright step on the Actions runner (a few seconds of CI time). |
| CI / deployment | F | B | **Fixed:** `.github/workflows/pages.yml` builds the dashboard at `/AramideLanding/` and serves the untouched site at `/AramideLanding/landing/`. **Remaining:** Pages must be enabled in the repo settings, and the subject must consent to public hosting under this account. |
| Threats / limitations | n/a | stated | The audit is static regex analysis of one file, not a rendered accessibility scan. The contrast pairs assume the background given by the DOM structure, not hover states or overlays. There is no visitor data. |
| Related work | n/a | n/a | Not applicable to a client portfolio. The checks follow WCAG 2.x (contrast, name/role/value) and MDN guidance on `rel=noopener`. |
| Documentation | C | B | The README now links the dashboard, the checks and the open findings. It was a generic template before. |

## Deliberately not changed

- **Email address and year count.** Replacing them would invent facts about a real person. They stay as reported findings until the owner supplies the values.
- **Palette.** The contrast failures are real, but the colours are the client's visual identity. The dashboard's contrast calculator lets the owner try alternatives.
