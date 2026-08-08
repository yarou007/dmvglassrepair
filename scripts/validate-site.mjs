import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  analyticsLocations,
  analyticsServices,
  canonicalOrigin,
  corePhonePages,
  excludedHtmlFiles,
  primaryPhone as phoneConfig,
  redirectMap,
  retiredRedirects,
} from "./site-config.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const primaryPhone = phoneConfig.e164;
const allowedPositions = new Set([
  "header",
  "hero",
  "after_intro",
  "mid_page",
  "before_faq",
  "final_cta",
  "footer",
  "sticky_mobile",
  "emergency_banner",
]);
const redirectSources = new Set(redirectMap.keys());
const requiredCorePositions = new Set([
  "header",
  "hero",
  "after_intro",
  "mid_page",
  "before_faq",
  "final_cta",
  "footer",
]);
const errors = [];
const warnings = [];

const files = (await readdir(root)).filter((name) => name.endsWith(".html"));
const indexableFiles = files.filter(
  (name) => !excludedHtmlFiles.has(name) && !redirectSources.has(name)
);
const documents = new Map();
for (const file of files) documents.set(file, await readFile(resolve(root, file), "utf8"));

const decode = (value = "") =>
  value
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&rarr;|→/g, "→")
    .replace(/\s+/g, " ")
    .trim();
const comparable = (value) =>
  decode(value)
    .replace(/\s+([.,;:!?])/g, "$1")
    .replace(/[—–]/g, "-")
    .toLowerCase();
const matches = (value, pattern) => [...value.matchAll(pattern)];
const tags = (html, name) => html.match(new RegExp(`<${name}\\b[^>]*>`, "gi")) || [];
const attribute = (tag = "", name) =>
  tag.match(new RegExp(`\\b${name}=["']([^"']*)["']`, "i"))?.[1] || "";
const tagWith = (html, name, attr, expected) =>
  tags(html, name).filter((tag) =>
    new RegExp(`\\b${attr}=["']${expected}["']`, "i").test(tag)
  );
const expectedCanonical = (file) =>
  file === "index.html" ? `${canonicalOrigin}/` : `${canonicalOrigin}/${file}`;

const parseInternalReference = (reference, sourceFile) => {
  if (!reference || /^(?:tel:|mailto:|sms:|javascript:|data:|\/\/)/i.test(reference)) return null;
  if (/(?:^|\/)(?:\.\.|%2e%2e)(?:\/|$)/i.test(reference.split(/[?#]/, 1)[0])) {
    return { traversal: true };
  }
  try {
    const url = new URL(reference, expectedCanonical(sourceFile));
    if (!["http:", "https:"].includes(url.protocol)) return null;
    if (!/(^|\.)dmv247glassrepair\.com$/i.test(url.hostname)) return null;
    const pathname = decodeURIComponent(url.pathname);
    const target = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    return {
      target,
      fragment: decodeURIComponent(url.hash.slice(1)),
      nonCanonical: url.protocol !== "https:" || url.hostname !== "www.dmv247glassrepair.com",
    };
  } catch {
    return { invalid: true };
  }
};

const pathWithinRoot = (target) => {
  const absolute = resolve(root, target);
  const fromRoot = relative(root, absolute);
  if (!fromRoot || (!fromRoot.startsWith("..") && !isAbsolute(fromRoot))) return absolute;
  return null;
};

const duplicateValues = (label, records) => {
  const groups = new Map();
  for (const [file, value] of records) {
    const key = comparable(value);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(file);
  }
  for (const group of groups.values()) {
    if (group.length > 1) errors.push(`Duplicate ${label}: ${group.join(", ")}`);
  }
};

const titles = [];
const descriptions = [];
const h1s = [];

for (const file of indexableFiles) {
  const html = documents.get(file);
  const titleMatches = matches(html, /<title>([\s\S]*?)<\/title>/gi);
  const h1Matches = matches(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/gi);
  const descriptionTags = tagWith(html, "meta", "name", "description");
  const canonicalTags = tagWith(html, "link", "rel", "canonical");
  const ogUrlTags = tagWith(html, "meta", "property", "og:url");
  const ogTitleTags = tagWith(html, "meta", "property", "og:title");
  const ogDescriptionTags = tagWith(html, "meta", "property", "og:description");
  const ogImageTags = tagWith(html, "meta", "property", "og:image");
  const twitterCardTags = tagWith(html, "meta", "name", "twitter:card");
  const twitterTitleTags = tagWith(html, "meta", "name", "twitter:title");
  const twitterDescriptionTags = tagWith(html, "meta", "name", "twitter:description");

  if (titleMatches.length !== 1) errors.push(`${file}: expected 1 title, found ${titleMatches.length}`);
  if (h1Matches.length !== 1) errors.push(`${file}: expected 1 H1, found ${h1Matches.length}`);
  if (descriptionTags.length !== 1) errors.push(`${file}: expected 1 meta description, found ${descriptionTags.length}`);
  if (canonicalTags.length !== 1) errors.push(`${file}: expected 1 canonical, found ${canonicalTags.length}`);
  if (ogUrlTags.length !== 1) errors.push(`${file}: expected 1 og:url, found ${ogUrlTags.length}`);
  if (ogTitleTags.length !== 1) errors.push(`${file}: expected 1 og:title, found ${ogTitleTags.length}`);
  if (ogDescriptionTags.length !== 1) errors.push(`${file}: expected 1 og:description, found ${ogDescriptionTags.length}`);
  if (ogImageTags.length !== 1) errors.push(`${file}: expected 1 og:image, found ${ogImageTags.length}`);
  if (twitterCardTags.length !== 1) errors.push(`${file}: expected 1 twitter:card, found ${twitterCardTags.length}`);
  if (twitterTitleTags.length !== 1) errors.push(`${file}: expected 1 twitter:title, found ${twitterTitleTags.length}`);
  if (twitterDescriptionTags.length !== 1) errors.push(`${file}: expected 1 twitter:description, found ${twitterDescriptionTags.length}`);

  const title = decode(titleMatches[0]?.[1]);
  const h1 = decode(h1Matches[0]?.[1]);
  const description = attribute(descriptionTags[0], "content");
  const canonical = attribute(canonicalTags[0], "href");
  const ogUrl = attribute(ogUrlTags[0], "content");
  titles.push([file, title]);
  h1s.push([file, h1]);
  descriptions.push([file, description]);
  if (!title) errors.push(`${file}: title is empty`);
  if (!h1) errors.push(`${file}: H1 is empty`);
  if (!description.trim()) errors.push(`${file}: meta description is empty`);
  if (!attribute(ogTitleTags[0], "content").trim()) errors.push(`${file}: og:title is empty`);
  if (!attribute(ogDescriptionTags[0], "content").trim()) errors.push(`${file}: og:description is empty`);
  if (!attribute(twitterTitleTags[0], "content").trim()) errors.push(`${file}: twitter:title is empty`);
  if (!attribute(twitterDescriptionTags[0], "content").trim()) errors.push(`${file}: twitter:description is empty`);

  const expected = expectedCanonical(file);
  if (canonical !== expected) errors.push(`${file}: canonical is ${canonical || "missing"}; expected ${expected}`);
  if (ogUrl !== expected) errors.push(`${file}: og:url is ${ogUrl || "missing"}; expected ${expected}`);
  if (/noindex/i.test(html)) errors.push(`${file}: contains noindex`);

  const gaCount = (html.match(/googletagmanager\.com\/gtag\/js\?id=G-7ZE9DVWNFN/g) || []).length;
  const gaConfigCount = (html.match(/gtag\(["']config["']\s*,\s*["']G-7ZE9DVWNFN["']\)/g) || []).length;
  const ahrefsCount = (html.match(/analytics\.ahrefs\.com\/analytics\.js/g) || []).length;
  if (gaCount !== 1) errors.push(`${file}: expected one GA4 base loader, found ${gaCount}`);
  if (gaConfigCount !== 1) errors.push(`${file}: expected one GA4 config call, found ${gaConfigCount}`);
  if (ahrefsCount > 1) errors.push(`${file}: Ahrefs loader duplicated (${ahrefsCount})`);
  if (!/assets\/main\.js/.test(html)) errors.push(`${file}: shared main.js is missing`);

  if (/href=["']index\.html["']/i.test(html)) errors.push(`${file}: links to index.html`);
  if (/href=["']#["']/i.test(html)) errors.push(`${file}: contains placeholder href="#"`);
  if (/data-cta-location=/i.test(html)) errors.push(`${file}: contains legacy data-cta-location`);
  for (const tag of html.match(/<[a-z][^<>]*>/gi) || []) {
    const seenAttributes = new Set();
    for (const match of tag.matchAll(/\s([a-z_:][-a-z0-9_:.]*)\s*=/gi)) {
      const name = match[1].toLowerCase();
      if (seenAttributes.has(name)) {
        errors.push(`${file}: duplicate ${name} attribute in ${tag.slice(0, 100)}`);
        break;
      }
      seenAttributes.add(name);
    }
  }
  const declaredPositions = new Set();
  for (const match of html.matchAll(/data-cta-position=["']([^"']+)["']/gi)) {
    declaredPositions.add(match[1]);
    if (!allowedPositions.has(match[1])) errors.push(`${file}: unsupported CTA position ${match[1]}`);
  }
  const body = tags(html, "body")[0] || "";
  const bodyService = attribute(body, "data-service");
  const bodyLocation = attribute(body, "data-location");
  if (!analyticsServices.has(bodyService) || !analyticsLocations.has(bodyLocation)) {
    errors.push(`${file}: body has missing or uncontrolled analytics service/location context`);
  }
  if (corePhonePages.has(file)) {
    for (const position of requiredCorePositions) {
      if (!declaredPositions.has(position)) errors.push(`${file}: missing core telephone CTA position ${position}`);
    }
  }

  if (/<form\b|<textarea\b|type=["']submit["']|href=["'](?:mailto:|sms:|https?:\/\/(?:wa\.me|api\.whatsapp))/i.test(html)) {
    errors.push(`${file}: exposes a prohibited non-phone conversion mechanism`);
  }
  if (/202-643-4062|tel:\+12026434062|\+1-202-643-4062/i.test(html)) {
    errors.push(`${file}: still promotes the secondary phone without a distinct role`);
  }
  if (
    /\b(?:send|share|text|upload|submit|provide|request)\b[^.<]{0,100}\b(?:photos?|videos?)\b|\bcall\s+or\s+text\b|\brequest\s+(?:a\s+)?(?:callback|quote|service|scheduled\s+(?:repair|visit|service))\b|\bwhat\s+to\s+send\b/i.test(html)
  ) {
    errors.push(`${file}: contains prohibited photo/text/callback/quote-request copy`);
  }
  if (/"(?:ratingValue|reviewCount|geo|openingHoursSpecification|priceRange)"\s*:/i.test(html)) {
    errors.push(`${file}: structured data contains an unsupported business field`);
  }
  if (/"address"\s*:\s*\{/i.test(html)) {
    errors.push(`${file}: structured data contains an unverified public address`);
  }

  for (const match of html.matchAll(/<a\b([^>]*\bhref=["']tel:([^"']+)["'][^>]*)>([\s\S]*?)<\/a>/gi)) {
    const number = match[2];
    const visible = decode(match[3]);
    if (number !== primaryPhone) errors.push(`${file}: non-primary/non-E.164 tel target tel:${number}`);
    const visibleNumber = visible.match(/(?:\+?1[- .]?)?\d{3}[- .]\d{3}[- .]\d{4}/)?.[0];
    if (visibleNumber && !visibleNumber.includes("703-244-0559")) {
      errors.push(`${file}: visible telephone ${visibleNumber} does not match tel:${number}`);
    }
  }

  for (const tag of tags(html, "a")) {
    const className = attribute(tag, "class");
    if (!/(?:^|\s)(?:call-cta|nav-cta|cta-phone|mobile-call-sticky)(?:\s|$)/i.test(className)) continue;
    if (attribute(tag, "href") !== `tel:${primaryPhone}`) {
      errors.push(`${file}: telephone CTA class does not use the primary tel destination (${tag.slice(0, 120)})`);
    }
  }

  const jsonLdBlocks = matches(
    html,
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );
  const visibleText = comparable(
    html
      .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
  );
  for (const [index, block] of jsonLdBlocks.entries()) {
    try {
      const data = JSON.parse(block[1]);
      const queue = Array.isArray(data) ? [...data] : [data];
      while (queue.length) {
        const item = queue.shift();
        if (!item || typeof item !== "object") continue;
        if (Object.hasOwn(item, "telephone")) {
          const numbers = Array.isArray(item.telephone) ? item.telephone : [item.telephone];
          if (
            numbers.length !== 1 ||
            String(numbers[0]).replace(/\D/g, "") !== primaryPhone.replace(/\D/g, "")
          ) {
            errors.push(`${file}: structured-data telephone is not the single primary number`);
          }
        }
        if (item["@type"] === "FAQPage") {
          for (const entry of item.mainEntity || []) {
            const question = comparable(entry?.name);
            const answer = comparable(entry?.acceptedAnswer?.text);
            if (question && !visibleText.includes(question)) {
              errors.push(`${file}: FAQ schema question is not visible: ${entry.name}`);
            }
            if (answer && !visibleText.includes(answer)) {
              errors.push(`${file}: FAQ schema answer is not visible verbatim: ${entry?.name}`);
            }
          }
        }
        for (const value of Object.values(item)) {
          if (Array.isArray(value)) queue.push(...value);
          else if (value && typeof value === "object") queue.push(value);
        }
      }
    } catch (error) {
      errors.push(`${file}: JSON-LD block ${index + 1} is invalid (${error.message})`);
    }
  }

  for (const tag of tags(html, "img")) {
    const source = attribute(tag, "src");
    if (!attribute(tag, "width") || !attribute(tag, "height")) {
      errors.push(`${file}: image lacks intrinsic dimensions (${source})`);
    }
    if (!/loading=["'](?:lazy|eager)["']/i.test(tag)) {
      errors.push(`${file}: image lacks an explicit loading policy (${source})`);
    }
    const imageReferences = [source];
    const srcset = attribute(tag, "srcset");
    if (srcset) {
      imageReferences.push(...srcset.split(",").map((candidate) => candidate.trim().split(/\s+/, 1)[0]));
    }
    for (const reference of imageReferences) {
      const parsed = parseInternalReference(reference, file);
      if (!parsed) continue;
      if (parsed.invalid || parsed.traversal) {
        errors.push(`${file}: invalid or escaping image reference ${reference}`);
        continue;
      }
      if (parsed.nonCanonical && /^https?:/i.test(reference)) {
        errors.push(`${file}: image uses a noncanonical same-site URL ${reference}`);
      }
      const imagePath = pathWithinRoot(parsed.target);
      if (!imagePath) {
        errors.push(`${file}: image escapes the repository ${reference}`);
        continue;
      }
      try {
        await stat(imagePath);
      } catch {
        errors.push(`${file}: missing image ${reference}`);
      }
    }
  }

  for (const tag of tags(html, "source")) {
    const srcset = attribute(tag, "srcset");
    for (const reference of srcset.split(",").map((candidate) => candidate.trim().split(/\s+/, 1)[0]).filter(Boolean)) {
      const parsed = parseInternalReference(reference, file);
      if (!parsed || parsed.invalid || parsed.traversal || !pathWithinRoot(parsed.target)) {
        errors.push(`${file}: invalid responsive source ${reference}`);
        continue;
      }
      try {
        await stat(pathWithinRoot(parsed.target));
      } catch {
        errors.push(`${file}: missing responsive source ${reference}`);
      }
    }
  }

  for (const match of html.matchAll(/<(?:a|script|link)\b[^>]*(?:href|src)=["']([^"']+)["'][^>]*>/gi)) {
    const reference = match[1];
    const parsed = parseInternalReference(reference, file);
    if (!parsed) continue;
    if (parsed.invalid || parsed.traversal) {
      errors.push(`${file}: invalid or escaping local reference ${reference}`);
      continue;
    }
    if (parsed.nonCanonical && /^https?:/i.test(reference)) {
      errors.push(`${file}: absolute internal URL is not HTTPS/www (${reference})`);
    }
    if (redirectSources.has(parsed.target)) errors.push(`${file}: internally links to redirect source ${parsed.target}`);
    const localPath = pathWithinRoot(parsed.target);
    if (!localPath) {
      errors.push(`${file}: local reference escapes the repository ${reference}`);
      continue;
    }
    try {
      await stat(localPath);
    } catch {
      errors.push(`${file}: broken local reference ${reference}`);
    }
    if (parsed.fragment && documents.has(parsed.target)) {
      const targetHtml = documents.get(parsed.target);
      if (
        !targetHtml.includes(`id="${parsed.fragment}"`) &&
        !targetHtml.includes(`id='${parsed.fragment}'`)
      ) {
        errors.push(`${file}: missing fragment target ${reference}`);
      }
    }
  }

  if (/24\/7/i.test(html)) warnings.push(`${file}: 24/7 availability requires business verification`);
}

duplicateValues("title", titles);
duplicateValues("meta description", descriptions);
duplicateValues("H1", h1s);

let siteManifest;
let vercelConfig;
for (const jsonFile of ["site.webmanifest", "vercel.json"]) {
  try {
    const data = JSON.parse(await readFile(resolve(root, jsonFile), "utf8"));
    if (jsonFile === "site.webmanifest") siteManifest = data;
    if (jsonFile === "vercel.json") vercelConfig = data;
  } catch (error) {
    errors.push(`${jsonFile}: invalid JSON (${error.message})`);
  }
}

if (siteManifest) {
  for (const icon of siteManifest.icons || []) {
    const iconPath = pathWithinRoot(icon.src || "");
    if (!iconPath) {
      errors.push(`site.webmanifest: invalid icon path ${icon.src || "missing"}`);
      continue;
    }
    try {
      const buffer = await readFile(iconPath);
      const declared = String(icon.sizes || "").match(/^(\d+)x(\d+)$/);
      if (
        declared &&
        buffer.length >= 24 &&
        buffer.toString("ascii", 1, 4) === "PNG" &&
        (buffer.readUInt32BE(16) !== Number(declared[1]) ||
          buffer.readUInt32BE(20) !== Number(declared[2]))
      ) {
        errors.push(`site.webmanifest: ${icon.src} does not match declared size ${icon.sizes}`);
      }
    } catch {
      errors.push(`site.webmanifest: missing icon ${icon.src}`);
    }
  }
}

if (vercelConfig) {
  const redirects = Array.isArray(vercelConfig.redirects) ? vercelConfig.redirects : [];
  const expectedRedirects = [
    { source: "/index.html", destination: `${canonicalOrigin}/` },
    ...retiredRedirects.map(({ source, destination }) => ({
      source: `/${source}`,
      destination: `${canonicalOrigin}/${destination}`,
    })),
  ];
  for (const expected of expectedRedirects) {
    const matches = redirects.filter((redirect) => redirect.source === expected.source);
    if (matches.length !== 1) {
      errors.push(`vercel.json: expected one redirect for ${expected.source}, found ${matches.length}`);
      continue;
    }
    if (matches[0].destination !== expected.destination || matches[0].statusCode !== 301) {
      errors.push(`vercel.json: ${expected.source} must be a 301 to ${expected.destination}`);
    }
  }
  const hostRedirects = redirects.filter(
    (redirect) =>
      redirect.source === "/:path*" &&
      redirect.has?.some(
        (condition) => condition.type === "host" && condition.value === "dmv247glassrepair.com"
      )
  );
  if (
    hostRedirects.length !== 1 ||
    hostRedirects[0].destination !== `${canonicalOrigin}/:path*` ||
    hostRedirects[0].statusCode !== 301
  ) {
    errors.push("vercel.json: apex host must redirect every path directly to HTTPS/www with status 301");
  }
}

const sitemap = await readFile(resolve(root, "sitemap.xml"), "utf8");
const sitemapLocations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const sitemapUrls = new Set(sitemapLocations);
const expectedUrls = new Set(indexableFiles.map(expectedCanonical));
if (!/^<\?xml[^>]+>\s*<urlset\b[^>]*>[\s\S]*<\/urlset>\s*$/i.test(sitemap.trim())) {
  errors.push("sitemap.xml: malformed XML envelope");
}
if (sitemapLocations.length !== sitemapUrls.size) errors.push("sitemap.xml: contains duplicate loc values");
const sitemapBlocks = sitemap.match(/<url>[\s\S]*?<\/url>/g) || [];
if (sitemapBlocks.length !== sitemapLocations.length) errors.push("sitemap.xml: every URL must be in one url block");
for (const block of sitemapBlocks) {
  const locCount = (block.match(/<loc>/g) || []).length;
  const lastmods = [...block.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((match) => match[1]);
  if (locCount !== 1 || lastmods.length !== 1) errors.push("sitemap.xml: each url block needs one loc and one lastmod");
  if (lastmods[0] && !/^\d{4}-\d{2}-\d{2}$/.test(lastmods[0])) {
    errors.push(`sitemap.xml: invalid lastmod ${lastmods[0]}`);
  }
}
for (const url of sitemapUrls) if (!expectedUrls.has(url)) errors.push(`sitemap.xml: unexpected URL ${url}`);
for (const url of expectedUrls) if (!sitemapUrls.has(url)) errors.push(`sitemap.xml: missing URL ${url}`);

const robots = await readFile(resolve(root, "robots.txt"), "utf8");
if (!robots.includes(`Sitemap: ${canonicalOrigin}/sitemap.xml`)) {
  errors.push("robots.txt: canonical sitemap directive is missing");
}

const mainJs = await readFile(resolve(root, "assets/main.js"), "utf8");
if (!/"phone_click"/.test(mainJs)) errors.push("assets/main.js: phone_click event is missing");
if (/phone_call_click|qualified_phone_call|booked_job|form_(?:start|submit|error)|callback_submit/.test(mainJs)) {
  errors.push("assets/main.js: contains a prohibited or misleading analytics event");
}
if ((mainJs.match(/document\.addEventListener\("click"/g) || []).length !== 1) {
  errors.push("assets/main.js: expected exactly one delegated document click listener");
}

if (warnings.length) {
  console.log(`Warnings (${warnings.length}; business verification reminders):`);
  console.log(warnings.map((warning) => `- ${warning}`).join("\n"));
}
if (errors.length) {
  console.error(`Validation failed with ${errors.length} error(s):`);
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Validation passed for ${indexableFiles.length} indexable pages.`);
}
