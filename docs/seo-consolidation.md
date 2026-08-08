# SEO consolidation and redirect record

## Canonical host

The preferred origin is `https://www.dmv247glassrepair.com`. Repository redirects are defined in `vercel.json` and use server-side HTTP `301` responses.

The live Vercel project currently handles `dmv247glassrepair.com` as a temporary domain redirect before repository routing. In **Vercel Project Settings → Domains**, change the apex-domain redirect to a permanent redirect to `www.dmv247glassrepair.com`. If Vercel continues to redirect `http://dmv247glassrepair.com` to the HTTPS apex before the project rule runs, the domain setting must be corrected at the edge; HTML, JavaScript, canonicals, and `robots.txt` cannot remove that hop.

## Implemented redirects

| Retired URL | Canonical survivor | Reason |
|---|---|---|
| `/index.html` | `/` | Exact duplicate of the public homepage |
| `/emergency-glass-repair.html` | `/emergency-glass-repair-washington-dc.html` | Weak/misaligned legacy page competing with the strongest emergency-glass landing page |
| `/emergency-board-up.html` | `/emergency-board-up-washington-dc.html` | Orphan transactional duplicate; the survivor includes the secure, assess/measure, replacement workflow |
| `/storefront-glass-repair.html` | `/storefront-glass-repair-washington-dc.html` | Orphan transactional duplicate; the survivor covers panes, door glass, sidelites, transoms, glass type, dispatch, and replacement |
| `/commercial-glass-repair-dc.html` | `/commercial-glass-repair-washington-dc.html` | Exact Washington DC commercial-glass intent duplicate |
| `/washington-dc-commercial-glass.html` | `/commercial-glass-repair-washington-dc.html` | Alternate word-order URL targeting the same transactional intent |

All redirect destinations are absolute canonical `https://www` URLs to avoid an additional host-normalization hop. Internal links and the XML sitemap must reference only the survivors.

## Primary transactional cluster

- `/`
- `/emergency-glass-repair-washington-dc.html`
- `/emergency-board-up-washington-dc.html`
- `/storefront-glass-repair-washington-dc.html`
- `/commercial-glass-repair-washington-dc.html`
- `/commercial-door-repair-washington-dc.html`
- `/glass-door-repair-washington-dc.html`
- `/door-closer-repair-washington-dc.html`
- `/service-areas.html`

Supporting guides retain informational titles and canonicals, then link to the closest transactional page. They are not redirected to the homepage.

## Deferred consolidation decisions

The following pages remain live because their scope may be distinct or because existing visibility data was unavailable:

- `/commercial-glass-repair.html`
- `/commercial-glass-services.html`
- `/commercial-glass-door-repair.html`
- `/door-repair-washington-dc.html`
- `/door-repair.html`
- `/storefront-glass.html`
- `/residential-glass-services.html`
- `/tempered-glass-replacement.html`

Review their Google Search Console queries, landing-page clicks, links, and conversions before merging. If a later merge is approved, move unique useful material first, add a one-hop redirect to the closest intent match, update all internal links/canonicals/social metadata, and remove the source from the sitemap.

## Business verification

The repository consistently and intentionally presents 24/7 emergency call availability. The business must confirm that claim before deployment and keep it operationally accurate. No review, rating, response-time, street address, coordinates, license, insurance, job-count, or guarantee claim was added.
