import { readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { excludedHtmlFiles, redirectMap } from "./site-config.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const files = (await readdir(root))
  .filter((name) => name.endsWith(".html"))
  .filter((name) => !excludedHtmlFiles.has(name));

const decode = (value = "") =>
  value
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tagWith = (html, tagName, attribute, value) => {
  const tags = html.match(new RegExp(`<${tagName}\\b[^>]*>`, "gi")) || [];
  return tags.find((tag) =>
    new RegExp(`\\b${attribute}=["']${value}["']`, "i").test(tag)
  );
};

const attribute = (tag = "", name) =>
  tag.match(new RegExp(`\\b${name}=["']([^"']*)["']`, "i"))?.[1] || "";

const normalizeInternalHref = (href) => {
  if (!href || /^(?:tel:|mailto:|sms:|javascript:|#)/i.test(href)) return null;
  try {
    if (/^https?:/i.test(href)) {
      const url = new URL(href);
      if (!/(^|\.)dmv247glassrepair\.com$/i.test(url.hostname)) return null;
      href = url.pathname;
    }
  } catch {
    return null;
  }
  const clean = href.split(/[?#]/, 1)[0].replace(/^\.\//, "");
  if (clean === "/" || clean === "" || clean === "index.html") return "index.html";
  return clean.replace(/^\//, "");
};

const documents = new Map();
for (const file of files) documents.set(file, await readFile(resolve(root, file), "utf8"));

const inboundOccurrences = new Map(files.map((file) => [file, 0]));
const inboundSources = new Map(files.map((file) => [file, new Set()]));
for (const [sourceFile, html] of documents) {
  if (redirectMap.has(sourceFile)) continue;
  for (const match of html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi)) {
    const target = normalizeInternalHref(match[1]);
    if (!target || !inboundOccurrences.has(target)) continue;
    inboundOccurrences.set(target, inboundOccurrences.get(target) + 1);
    inboundSources.get(target).add(sourceFile);
  }
}

const coreIntents = new Map([
  ["index.html", "emergency glass repair and board-up Washington DC / DMV"],
  ["emergency-glass-repair-washington-dc.html", "emergency glass repair Washington DC"],
  ["emergency-board-up-washington-dc.html", "emergency board-up Washington DC"],
  ["storefront-glass-repair-washington-dc.html", "storefront glass repair Washington DC"],
  ["commercial-glass-repair-washington-dc.html", "commercial glass repair Washington DC"],
  ["commercial-door-repair-washington-dc.html", "commercial door repair Washington DC"],
  ["glass-door-repair-washington-dc.html", "glass door repair Washington DC"],
  ["door-closer-repair-washington-dc.html", "door closer repair Washington DC"],
  ["service-areas.html", "Capital Glass Door service areas"],
]);

const csv = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
const rows = [[
  "path",
  "expected_status",
  "disposition",
  "redirect_target",
  "title",
  "meta_description",
  "h1",
  "canonical",
  "og_url",
  "inbound_link_occurrences",
  "inbound_source_pages",
  "intended_query_or_intent",
]];

for (const file of files.sort((a, b) => (a === "index.html" ? -1 : b === "index.html" ? 1 : a.localeCompare(b)))) {
  const html = documents.get(file);
  const title = decode(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]);
  const h1 = decode(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]);
  const description = attribute(tagWith(html, "meta", "name", "description"), "content");
  const canonical = attribute(tagWith(html, "link", "rel", "canonical"), "href");
  const ogUrl = attribute(tagWith(html, "meta", "property", "og:url"), "content");
  const redirectTarget = redirectMap.get(file) || "";
  const isArticle = /"@type"\s*:\s*"Article"/i.test(html);
  const intent = coreIntents.get(file) || `${isArticle ? "informational" : "service/location"}: ${h1}`;

  rows.push([
    file === "index.html" ? "/" : `/${file}`,
    redirectTarget ? 301 : 200,
    redirectTarget ? "redirect" : "indexable",
    redirectTarget ? `/${redirectTarget}` : "",
    title,
    description,
    h1,
    canonical,
    ogUrl,
    inboundOccurrences.get(file),
    inboundSources.get(file).size,
    intent,
  ]);
}

const output = `${rows.map((row) => row.map(csv).join(",")).join("\n")}\n`;
await writeFile(resolve(root, "docs/url-inventory.csv"), output);
console.log(`Wrote ${rows.length - 1} URL records to docs/url-inventory.csv.`);
