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
const materiallyUpdatedPaths = new Set([
  "/",
  "/about.html",
  "/services.html",
  "/faq.html",
  "/safety-compliance.html",
  "/emergency-glass-repair-washington-dc.html",
  "/emergency-board-up-washington-dc.html",
  "/storefront-glass-repair-washington-dc.html",
  "/commercial-glass-repair-washington-dc.html",
  "/commercial-door-repair-washington-dc.html",
  "/glass-door-repair-washington-dc.html",
  "/door-closer-repair-washington-dc.html",
  "/glass-repair-washington-dc.html",
  "/glass-repair-arlington-va.html",
  "/glass-repair-alexandria-va.html",
  "/glass-repair-fairfax-va.html",
  "/glass-repair-bethesda-md.html",
  "/glass-repair-silver-spring-md.html",
  "/glass-repair-rockville-md.html",
  "/what-to-do-when-storefront-glass-breaks-washington-dc.html",
  "/emergency-board-up-service-when-your-business-needs-it.html",
  "/storefront-glass-repair-vs-replacement.html",
  "/how-property-managers-should-handle-broken-commercial-glass.html",
  "/signs-your-door-closer-needs-repair.html",
  "/why-businesses-need-same-day-glass-repair.html",
  "/blog.html",
  "/blog-emergency-glass-prep.html",
  "/blog-energy-efficient-glass-trends-2026.html",
  "/blog-tempered-glass-safety.html",
  "/baltimore-glass-door-locksmith.html",
  "/commercial-door-hardware.html",
  "/commercial-glass-door-repair.html",
  "/commercial-glass-repair-property-managers-dmv.html",
  "/commercial-glass-repair.html",
  "/commercial-glass-services.html",
  "/common-commercial-door-problems-and-repairs.html",
  "/curtain-wall-glass-repair.html",
  "/door-repair.html",
  "/energy-efficient-glass.html",
  "/glass-door-installation.html",
  "/insulated-glass-unit-replacement.html",
  "/locksmith-services.html",
  "/maryland-commercial-glass.html",
  "/northern-virginia-commercial-glass.html",
  "/privacy-policy.html",
  "/terms.html",
  "/residential-glass-services.html",
  "/residential-glass-repair-dmv.html",
  "/shower-doors.html",
  "/shower-door-repair-dmv.html",
  "/storefront-framing-repair.html",
  "/storefront-glass.html",
  "/tempered-glass-replacement-dmv.html",
  "/tempered-glass-replacement.html",
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
  const lastmod = materiallyUpdatedPaths.has(path) ? "2026-08-08" : previousDate;
  if (!lastmod || !/^\d{4}-\d{2}-\d{2}$/.test(lastmod)) {
    throw new Error(`Missing a truthful lastmod value for ${loc}.`);
  }
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`;
});

const output = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${blocks.join("\n")}\n</urlset>\n`;
await writeFile(sitemapPath, output);
console.log(`Sitemap contains ${blocks.length} canonical URLs.`);
