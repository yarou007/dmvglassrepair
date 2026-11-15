> Historical report from August 2026. The current call/WhatsApp design and contact numbers are documented in [mobile-contact-update.md](mobile-contact-update.md).

# Phone-first SEO, CRO, and technical implementation report

Date: August 8, 2026

## Outcome

The static site now uses one phone-first conversion path, one canonical business identity, one delegated GA4 telephone event, and one HTTPS/www URL system. Sixty-four retained indexable pages pass the repository validator. The redirect rules are implemented in the repository but are not yet live; deployment and one Vercel domain-setting change are required before redirect verification can pass.

## 1. Files modified

Shared and generated files:

- `assets/main.js`
- `assets/styles.css`
- `site.webmanifest`
- `sitemap.xml`
- `.well-known/llms.txt`
- `llm.txt`
- `llms.txt`
- `llms-full.txt`

Seventy HTML documents were modified: 64 retained indexable documents (including `index.html`, which serves `/`), the five retired content documents, and `404.html`. The exact HTML files are:

```text
404.html
about.html
baltimore-glass-door-locksmith.html
blog-emergency-glass-prep.html
blog-energy-efficient-glass-trends-2026.html
blog-shower-door-maintenance.html
blog-tempered-glass-safety.html
blog.html
commercial-door-hardware.html
commercial-door-repair-washington-dc.html
commercial-glass-door-repair.html
commercial-glass-repair-dc.html
commercial-glass-repair-property-managers-dmv.html
commercial-glass-repair-washington-dc.html
commercial-glass-repair.html
commercial-glass-services.html
common-commercial-door-problems-and-repairs.html
curtain-wall-glass-repair.html
door-closer-repair-washington-dc.html
door-repair-washington-dc.html
door-repair.html
emergency-board-up-service-when-your-business-needs-it.html
emergency-board-up-vs-glass-replacement-what-comes-first.html
emergency-board-up-washington-dc.html
emergency-board-up.html
emergency-glass-repair-cost-factors-dmv-area.html
emergency-glass-repair-washington-dc.html
emergency-glass-repair.html
energy-efficient-glass.html
faq.html
foggy-double-pane-glass-replacement-dmv.html
glass-door-installation.html
glass-door-repair-washington-dc.html
glass-partitions.html
glass-repair-alexandria-va.html
glass-repair-arlington-va.html
glass-repair-bethesda-md.html
glass-repair-fairfax-va.html
glass-repair-rockville-md.html
glass-repair-silver-spring-md.html
glass-repair-washington-dc.html
how-long-does-storefront-glass-replacement-take.html
how-property-managers-should-handle-broken-commercial-glass.html
how-to-secure-a-business-after-a-break-in.html
index.html
insulated-glass-unit-replacement.html
locksmith-services.html
maryland-commercial-glass.html
northern-virginia-commercial-glass.html
privacy-policy.html
residential-glass-repair-dmv.html
residential-glass-services.html
safety-compliance.html
service-areas.html
services.html
shower-door-repair-dmv.html
shower-doors.html
signs-your-door-closer-needs-repair.html
storefront-framing-repair.html
storefront-glass-repair-vs-replacement.html
storefront-glass-repair-washington-dc.html
storefront-glass-repair.html
storefront-glass.html
tempered-glass-replacement-dmv.html
tempered-glass-replacement.html
tempered-glass-vs-laminated-glass-storefronts.html
terms.html
washington-dc-commercial-glass.html
what-to-do-when-storefront-glass-breaks-washington-dc.html
why-businesses-need-same-day-glass-repair.html
```

## 2. Files created

Configuration and documentation:

- `vercel.json`
- `docs/phone-analytics.md`
- `docs/seo-consolidation.md`
- `docs/url-inventory.csv`
- `docs/implementation-report.md`

Validation and maintenance tooling:

- `scripts/site-config.mjs`
- `scripts/normalize-site.mjs`
- `scripts/add-image-dimensions.mjs`
- `scripts/update-sitemap.mjs`
- `scripts/build-url-inventory.mjs`
- `scripts/validate-site.mjs`
- `scripts/browser_smoke.py`
- `scripts/check-live-redirects.mjs`

Responsive image assets:

- `images/board-up-storefront-panel-480.webp`
- `images/board-up-storefront-panel-768.webp`
- `images/emergency-board-up-480.webp`
- `images/emergency-board-up-768.webp`
- `images/glass-cutting-workbench-480.webp`
- `images/glass-cutting-workbench-768.webp`
- `images/storefront-gallery-01-480.webp`
- `images/storefront-gallery-01-768.webp`
- `images/storefront-gallery-02-480.webp`
- `images/storefront-gallery-02-768.webp`
- `images/storefront-gallery-07-480.webp`
- `images/storefront-gallery-07-768.webp`
- `images/window-192.png`

## 3. URLs changed

- The canonical origin is `https://www.dmv247glassrepair.com`.
- Homepage links now use `/`, never `/index.html`.
- Internal links and the sitemap use only retained canonical destinations, not redirect sources.
- The retained transactional cluster is `/`, emergency glass, board-up, storefront glass, commercial glass, commercial door, glass door, door closer, and service-area pages.
- Sixty-four retained canonical URLs are documented in `docs/url-inventory.csv`; five retired content URLs and `/index.html` are redirect sources.

## 4. Redirects created

`vercel.json` defines one-hop HTTP `301` rules:

| Source | Destination |
|---|---|
| `/index.html` | `/` |
| `/emergency-glass-repair.html` | `/emergency-glass-repair-washington-dc.html` |
| `/emergency-board-up.html` | `/emergency-board-up-washington-dc.html` |
| `/storefront-glass-repair.html` | `/storefront-glass-repair-washington-dc.html` |
| `/commercial-glass-repair-dc.html` | `/commercial-glass-repair-washington-dc.html` |
| `/washington-dc-commercial-glass.html` | `/commercial-glass-repair-washington-dc.html` |
| apex host, any path | same path on HTTPS/www |

The rules preserve intent and point directly at absolute HTTPS/www destinations. They remain pending deployment. Vercel's current project-domain redirect for the apex host must also be changed from temporary to permanent in **Project Settings -> Domains**.

## 5. Canonicals corrected

Every retained page has exactly one self-referencing HTTPS/www canonical and matching `og:url`. `/index.html`, non-www URLs, HTTP URLs, and retired content URLs are absent from the canonical sitemap set. The validator checks canonical, Open Graph URL, schema URL, internal-link targets, and sitemap agreement.

## 6. Titles changed

Titles are unique across all 64 retained pages and aligned with each page's primary intent. Core examples:

| Page | Title |
|---|---|
| Homepage | `Emergency Glass & Board-Up Washington DC | Capital Glass Door` |
| Emergency glass | `Emergency Glass Repair Washington DC | 24/7 Board-Up` |
| Board-up | `Emergency Board-Up Washington DC | Broken Storefront Glass` |
| Storefront | `Storefront Glass Repair Washington DC | Emergency Service` |
| Commercial glass | `Commercial Glass Repair Washington DC | Storefront & Door Glass` |
| Commercial door | `Commercial Door Repair Washington DC | Entrances & Hardware` |
| Glass door | `Glass Door Repair Washington DC | Door Glass Replacement` |
| Door closer | `Door Closer Repair Washington DC | Leaking & Slamming Doors` |

## 7. Meta descriptions changed

All 64 retained pages have exactly one unique description. High-intent descriptions now lead with the relevant problem, service, location, and telephone action. Generic, unsupported speed/compliance claims and competing quote/text/photo actions were removed. Open Graph and Twitter title/description fields were added or aligned with the page intent.

## 8. H1 changes

Every retained page has exactly one unique H1. The homepage now uses `Emergency Glass Repair & Board-Up in Washington DC`. The seven core landing pages use distinct service-led H1s for emergency glass, emergency board-up, storefront glass, commercial glass, commercial door, glass door, and door closer repair. Location pages retain geographic intent while adding genuinely local copy instead of swapping city names in cloned paragraphs.

## 9. Phone-number configuration changes

- The public primary number is `703-244-0559`; all dial links use `tel:+17032440559`.
- The unsupported secondary number was removed from page copy, links, structured data, and LLM-facing files.
- `assets/main.js` exposes a frozen `CapitalGlassDoor` configuration, and `scripts/site-config.mjs` provides the same build-time source values.
- All 439 static telephone links use the primary E.164 destination and matching visible number.
- Every page has controlled `data-service` and `data-location` context.

## 10. Header, hero, content, footer, and mobile CTA changes

- Header and hero actions are direct telephone links.
- Long core pages include calls after the introduction, mid-page, before FAQ, in the final CTA, and footer where applicable.
- CTA positions use the controlled values `emergency_banner`, `header`, `hero`, `after_intro`, `mid_page`, `before_faq`, `final_cta`, `footer`, and `sticky_mobile`.
- One JavaScript-created mobile sticky call bar appears at mobile widths, includes the visible number and accessible label, respects safe-area insets, clears page content, and hides while the mobile menu is open.
- The homepage hierarchy now prioritizes emergency glass, board-up, storefront, commercial glass, and commercial door before secondary scheduled services.
- The public review placeholder and dead social links were removed.

## 11. Analytics events implemented

One delegated click listener emits exactly one GA4 `phone_click` event for any `tel:` link without preventing or delaying the telephone action. It records path-only page and landing data, page title, controlled service/location/CTA context, visible number, sanitized UTM values, the first external referrer hostname, and click-ID presence booleans. It never sends click-ID values. Storage and analytics failures are caught so dialing still works. No form, qualified-call, or booked-job event is claimed.

GA4 setup and QA instructions are in `docs/phone-analytics.md`.

## 12. Forms remain disabled and unpromoted

The site contains no lead form, input, textarea, submit control, email/SMS/WhatsApp conversion destination, callback offer, or text/photo quote workflow. Conversion buttons are telephone links. No form-success, qualified-call, or booked-job analytics event was added.

## 13. Performance changes

- Only the true desktop homepage LCP image is eager and high priority.
- Below-fold images are lazy loaded.
- Images have intrinsic width and height attributes.
- Large homepage gallery images have 480-pixel and 768-pixel WebP variants with `srcset`/`sizes`; the former 1.4 MB board-up source is no longer the default small-grid transfer.
- The manifest now references a real 192x192 icon and the existing 512x512 icon.
- The desktop hero uses a non-overlapping grid and responsive breakpoint behavior.

No Lighthouse run was available in this environment, so no Lighthouse score is claimed.

## 14. Internal-link changes

All homepage aliases now point to `/`. Links to redirect sources were replaced with their survivors. High-intent pages cross-link to the closest related services, and informational guides add early contextual links plus later natural links to the relevant transactional page. The validator crawls local `href`/`src` targets, fragments, redirect sources, and insecure internal URLs.

## 15. Structured-data changes

- Business schema uses the primary E.164 telephone number and stable canonical identifiers.
- Unsupported address, coordinates, ratings, reviews, price range, hours, license, insurance, guarantee, and response-time claims were removed.
- FAQ schema is included only where matching visible questions and answers exist; visible/schema parity is validated.
- Canonical and schema URLs agree.

## 16. Sitemap changes

`sitemap.xml` contains 64 unique retained HTTPS/www canonical URLs and excludes redirect sources. Materially edited pages use an August 8, 2026 `lastmod`; untouched dates were preserved. The update script reconstructs the expected set, preserves truthful dates, and refuses an unexpectedly small sitemap.

## 17. robots.txt changes

No change was necessary. `robots.txt` remains crawlable and points to the canonical HTTPS/www sitemap. It is checked by the validator.

## 18. Accessibility changes

- Skip links and focusable H1 targets support keyboard navigation.
- Global focus-visible treatment and minimum 44x44-pixel interactive targets were added.
- Mobile navigation closes with Escape and restores focus.
- The sticky CTA has an action-and-number accessible label, safe-area positioning, and page-bottom clearance.
- Red/white CTA contrast was raised to an AA-compatible color pair.
- Continuous decorative animation was removed and reduced-motion behavior is honored.
- Responsive checks cover horizontal overflow and hero/media overlap.

## 19. Tests and validation commands run

Passing final static checks:

```text
node scripts/normalize-site.mjs                   # 0 files on second pass
node scripts/add-image-dimensions.mjs             # 0 files on second pass
node --check assets/main.js
node --check scripts/*.mjs                        # executed per file
Python compile/AST check for scripts/browser_smoke.py
JSON parse: vercel.json and site.webmanifest
XML parse: sitemap.xml
node scripts/validate-site.mjs                    # 64 indexable pages passed
git diff --check
```

A separate temporary-copy idempotence pass confirmed that normalization, image-dimension, sitemap, and URL-inventory generators changed zero content hashes and that the temp-copy validator passed.

The previously executed Chrome 143/ChromeDriver 143 smoke suite passed eight core pages, mobile menu/sticky behavior, one-event telephone analytics, analytics-blocked fallback, desktop behavior, browser-console checks, hero regressions at 961/1024/1200/1366 pixels, and a separate eight-city-page pass. Additional assertion-only coverage for tampered session attribution, first-external-referrer persistence, same-origin omission, and Baltimore analytics context was added afterward; its syntax passes, but that newest browser run could not be executed after the environment rejected browser approval at its usage limit.

Live redirect probes currently fail as expected because this worktree has not been deployed: `/index.html` and the five retired paths still return `200`, the HTTPS apex uses a temporary `307`, and HTTP apex traffic takes two hops. `scripts/check-live-redirects.mjs` is ready for the post-deploy check.

## 20. Build status

This is a flat static site with no package manifest, framework build, formatter, linter, or production-build command. Build status is therefore not applicable. The source-level parser, validator, crawler, generator-idempotence, and browser-smoke checks above are the applicable release gates.

## 21. Remaining technical issues

1. Deploy the worktree to Vercel.
2. Ensure all new, currently untracked files are included in the commit/deployment, especially `vercel.json`, the responsive images, the manifest icon, scripts, and documentation.
3. In Vercel Project Settings -> Domains, change the apex-domain redirect to a permanent direct redirect to `www.dmv247glassrepair.com`.
4. Run `node scripts/check-live-redirects.mjs` after deployment and confirm one permanent hop, query retention, and a final `200` for all canonical variants and retired URLs.
5. Rerun the newest browser-smoke assertions in an environment that permits the Selenium loopback socket.
6. Run Lighthouse or an equivalent field/performance audit; none is claimed here.
7. Consider shortening the ten unique but long titles that exceed 65 characters and the 174-character FAQ description if search-snippet truncation is observed.
8. Consider replacing the shared portrait 576x1024 social image with a purpose-built 1200x630 Open Graph/Twitter image.
9. Review the deferred consolidation candidates in `docs/seo-consolidation.md` against Google Search Console data before merging any more URLs.

## 22. Business claims requiring verification

- Confirm that 24/7 emergency telephone availability is accurate before deployment. The validator intentionally reports this reminder on 61 pages.
- Confirm the listed service types and geographic coverage match actual operations.
- Have the revised privacy disclosure and website terms reviewed for the business's actual operations, GA4/Ahrefs configuration, consent requirements, and retention practices.

No review count, star rating, street address, coordinates, response-time guarantee, license, insurance, job count, or code-compliance claim was added.
