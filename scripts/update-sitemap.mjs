import { readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  canonicalOrigin,
  excludedHtmlFiles,
  redirectMap,
} from "./site-config.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sitemapPath = resolve(root, "sitemap.xml");
// Pages materially updated for the call/WhatsApp release on November 15, 2026.
const materiallyUpdatedPaths = new Set([
  "/",
  "/about.html",
  "/baltimore-glass-door-locksmith.html",
  "/blog-emergency-glass-prep.html",
  "/blog-energy-efficient-glass-trends-2026.html",
  "/blog-shower-door-maintenance.html",
  "/blog-tempered-glass-safety.html",
  "/blog.html",
  "/commercial-door-hardware.html",
  "/commercial-door-repair-washington-dc.html",
  "/commercial-glass-door-repair.html",
  "/commercial-glass-repair-property-managers-dmv.html",
  "/commercial-glass-repair-washington-dc.html",
  "/commercial-glass-repair.html",
  "/commercial-glass-services.html",
  "/common-commercial-door-problems-and-repairs.html",
  "/curtain-wall-glass-repair.html",
  "/door-closer-repair-washington-dc.html",
  "/door-repair-washington-dc.html",
  "/door-repair.html",
  "/emergency-board-up-service-when-your-business-needs-it.html",
  "/emergency-board-up-vs-glass-replacement-what-comes-first.html",
  "/emergency-board-up-washington-dc.html",
  "/emergency-glass-repair-cost-factors-dmv-area.html",
  "/emergency-glass-repair-washington-dc.html",
  "/energy-efficient-glass.html",
  "/faq.html",
  "/foggy-double-pane-glass-replacement-dmv.html",
  "/glass-door-installation.html",
  "/glass-door-repair-washington-dc.html",
  "/glass-partitions.html",
  "/glass-repair-alexandria-va.html",
  "/glass-repair-arlington-va.html",
  "/glass-repair-bethesda-md.html",
  "/glass-repair-fairfax-va.html",
  "/glass-repair-rockville-md.html",
  "/glass-repair-silver-spring-md.html",
  "/glass-repair-washington-dc.html",
  "/how-long-does-storefront-glass-replacement-take.html",
  "/how-property-managers-should-handle-broken-commercial-glass.html",
  "/how-to-secure-a-business-after-a-break-in.html",
  "/insulated-glass-unit-replacement.html",
  "/locksmith-services.html",
  "/maryland-commercial-glass.html",
  "/northern-virginia-commercial-glass.html",
  "/privacy-policy.html",
  "/residential-glass-repair-dmv.html",
  "/residential-glass-services.html",
  "/safety-compliance.html",
  "/service-areas.html",
  "/services.html",
  "/shower-door-repair-dmv.html",
  "/shower-doors.html",
  "/signs-your-door-closer-needs-repair.html",
  "/storefront-framing-repair.html",
  "/storefront-glass-repair-vs-replacement.html",
  "/storefront-glass-repair-washington-dc.html",
  "/storefront-glass.html",
  "/tempered-glass-replacement-dmv.html",
  "/tempered-glass-replacement.html",
  "/tempered-glass-vs-laminated-glass-storefronts.html",
  "/terms.html",
  "/what-to-do-when-storefront-glass-breaks-washington-dc.html",
  "/why-businesses-need-same-day-glass-repair.html",
]);

const original = await readFile(sitemapPath, "utf8");
const existingDates = new Map();
for (const block of original.match(/<url>[\s\S]*?<\/url>/g) || []) {
  const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1];
  const lastmod = block.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1];
  if (loc && lastmod && !existingDates.has(loc)) existingDates.set(loc, lastmod);
}

const files = (await readdir(root))
  .filter((name) => name.endsWith(".html"))
  .filter((name) => !excludedHtmlFiles.has(name) && !redirectMap.has(name))
  .sort((a, b) => (a === "index.html" ? -1 : b === "index.html" ? 1 : a.localeCompare(b)));

if (files.length < 10) {
  throw new Error(`Refusing to write an unexpectedly small sitemap (${files.length} pages).`);
}

const blocks = files.map((file) => {
  const path = file === "index.html" ? "/" : `/${file}`;
  const loc = `${canonicalOrigin}${path}`;
  const previousDate = existingDates.get(loc);
  const lastmod = materiallyUpdatedPaths.has(path) && (!previousDate || previousDate < "2026-11-15")
    ? "2026-11-15"
    : previousDate;
  if (!lastmod || !/^\d{4}-\d{2}-\d{2}$/.test(lastmod)) {
    throw new Error(`Missing a truthful lastmod value for ${loc}.`);
  }
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`;
});

const output = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${blocks.join("\n")}\n</urlset>\n`;
await writeFile(sitemapPath, output);
console.log(`Sitemap contains ${blocks.length} canonical URLs.`);
