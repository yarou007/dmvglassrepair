import { readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { redirectMap } from "./site-config.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const entries = await readdir(root, { withFileTypes: true });
const htmlFiles = entries
  .filter((entry) => entry.isFile() && entry.name.endsWith(".html"))
  .map((entry) => entry.name)
  .filter((name) => name !== "google10f3f95e19031958.html");

const replaceAll = (value, replacements) =>
  replacements.reduce((result, [pattern, replacement]) => result.replace(pattern, replacement), value);

const dataPositionMap = new Map([
  ["header-nav", "header"],
  ["header-nav-secondary", "header"],
  ["after-intro", "after_intro"],
  ["after_intro", "after_intro"],
  ["before-faq", "before_faq"],
  ["before_faq", "before_faq"],
  ["bottom-cta", "final_cta"],
  ["final", "final_cta"],
  ["final_cta", "final_cta"],
  ["footer", "footer"],
  ["hero", "hero"],
  ["mid-page", "mid_page"],
  ["mid_page", "mid_page"],
  ["top-bar", "emergency_banner"],
  ["emergency-banner", "emergency_banner"],
  ["emergency_banner", "emergency_banner"],
  ["sticky-mobile", "sticky_mobile"],
  ["sticky_mobile", "sticky_mobile"],
  ["content", "mid_page"],
]);

const serviceForFile = (file) => {
  const routeRules = [
    [/^index\.html$/, "emergency-glass-repair"],
    [/baltimore-glass-door-locksmith/, "emergency-glass-repair"],
    [/emergency-board-up|board-up-vs|how-to-secure-a-business/, "emergency-board-up"],
    [/door-closer|signs-your-door-closer/, "door-closer-repair"],
    [/commercial-glass-door/, "glass-door-repair"],
    [/glass-door-installation/, "glass-door-installation"],
    [/glass-door-repair/, "glass-door-repair"],
    [/commercial-door-hardware/, "door-hardware"],
    [/commercial-door|door-repair|common-commercial-door/, "commercial-door-repair"],
    [/curtain-wall/, "curtain-wall-glass-repair"],
    [/storefront-framing/, "storefront-framing-repair"],
    [/storefront/, "storefront-glass-repair"],
    [/emergency-glass|businesses-need-same-day/, "emergency-glass-repair"],
    [/commercial-glass|property-managers|broken-commercial-glass/, "commercial-glass-repair"],
    [/^glass-repair-/, "glass-repair"],
    [/tempered/, "tempered-glass-replacement"],
    [/foggy|insulated-glass/, "insulated-glass-replacement"],
    [/energy-efficient/, "energy-efficient-glass"],
    [/glass-partitions/, "glass-partitions"],
    [/shower/, "shower-door-repair"],
    [/residential/, "residential-glass-repair"],
    [/locksmith/, "locksmith-service"],
    [/safety-compliance/, "safety-glazing"],
    [/services|service-areas/, "multi-service"],
    [/about|faq|blog|privacy-policy|terms/, "site-information"],
  ];
  return routeRules.find(([pattern]) => pattern.test(file))?.[1] || "glass-repair";
};

const locationForFile = (file) => {
  if (file === "index.html") return "washington-dc-dmv";
  const city = file.match(
    /(washington-dc|arlington-va|alexandria-va|fairfax-va|bethesda-md|silver-spring-md|rockville-md|baltimore(?:-md)?)/
  )?.[1];
  if (city) return city.replace(/^baltimore$/, "baltimore-md");
  if (file.includes("northern-virginia")) return "northern-virginia";
  if (file.includes("maryland")) return "maryland";
  return "dmv";
};

let changedCount = 0;

for (const file of htmlFiles) {
  const path = resolve(root, file);
  const original = await readFile(path, "utf8");
  let html = original;

  if (!html.includes("googletagmanager.com/gtag/js?id=G-7ZE9DVWNFN")) {
    html = html.replace(
      /<head>/i,
      `<head>\n<script async src="https://www.googletagmanager.com/gtag/js?id=G-7ZE9DVWNFN"></script>\n<script>\n  window.dataLayer = window.dataLayer || [];\n  function gtag(){dataLayer.push(arguments);}\n  gtag("js", new Date());\n  gtag("config", "G-7ZE9DVWNFN");\n</script>`
    );
  }

  html = replaceAll(html, [
    [/href=(['"])index\.html\1/gi, 'href="/"'],
    [
      /<a\b([^>]*\bclass=["'][^"']*\bskip-link\b[^"']*["'][^>]*)\bhref=["']#main["']([^>]*)>/gi,
      '<a$1href="#page-title"$2>',
    ],
    [
      /content="width=device-width, initial-scale=1\.0"/gi,
      'content="width=device-width, initial-scale=1.0, viewport-fit=cover"',
    ],
    [
      /\[\s*"\+1-703-244-0559"\s*,\s*"\+1-202-643-4062"\s*\]/g,
      '"+1-703-244-0559"',
    ],
    [/\+1-703-244-0559/g, "+17032440559"],
    [/703-244-0559\s*(?:or|and|\/|\|)\s*202-643-4062/gi, "703-244-0559"],
    [/\+1-703-244-0559\s*,\s*\+1-202-643-4062/g, "+1-703-244-0559"],
    [/https:\/\/www\.dmv247glassrepair\.com\/#localbusiness/g, "https://www.dmv247glassrepair.com/#business"],
    [/<h2>Request Service<\/h2>/gi, "<h2>Call for Service</h2>"],
    [/<h2>Get a Quote<\/h2>/gi, "<h2>Call for Service</h2>"],
    [
      /<h3>Same-Day Service<\/h3>\s*<p>When materials and access allow, we provide same day glass repair to help reduce downtime for businesses and residents\.<\/p>/gi,
      "<h3>Clear Scheduling</h3>\n          <p>Timing is discussed after the glass type, measurements, material needs, and site access are understood.</p>",
    ],
    [
      /<h3>Code-Compliant Work<\/h3>\s*<p>We install tempered and safety glass as needed and complete repairs with attention to code compliance and long-term performance\.<\/p>/gi,
      "<h3>Glass Type and Fit</h3>\n          <p>The opening is assessed to identify the glass type, dimensions, frame condition, and installation needs.</p>",
    ],
    [
      /<li>Licensed and insured technicians<\/li>/gi,
      "<li>Call-first assessment and scheduling</li>",
    ],
    [
      /texts?\s*(?:and|\/)\s*photos\s+are\s+welcome(?:\s+for\s+faster\s+quoting)?\.?/gi,
      "describe the opening, damage, and access conditions during the call.",
    ],
    [/\band text photos\.?/gi, "and describe the issue during the call."],
    [
      /call or text photos for faster estimating/gi,
      "call and describe the opening and known measurements for estimating",
    ],
    [
      /Text photos after you call for faster quoting/gi,
      "Call with the opening type, damage, and access details",
    ],
    [
      /send photos and your address so we can advise next steps/gi,
      "call with the service location and a description of the opening so we can discuss next steps",
    ],
    [
      /Send photos of the glass opening or door hardware issue/gi,
      "Describe the glass opening or door hardware issue during the call",
    ],
    [
      /send photos of the storefront and problem area/gi,
      "describe the storefront and problem area during the call",
    ],
    [
      /We’ll ask for the address, access status, and photos if available\./gi,
      "We’ll ask for the service location, opening type, damage, and access status.",
    ],
    [
      /Send photos, location details, and known measurements, and mention access restrictions up front\./gi,
      "Call with the service location, known measurements, and access restrictions.",
    ],
    [
      /Send photos, location, and any known measurements\. Mention if the opening is street-facing, tenant-facing, or in a high-traffic area so scope can be estimated more accurately\./gi,
      "Call with the service location and any known measurements. Mention if the opening is street-facing, tenant-facing, or in a high-traffic area so the next step can be discussed.",
    ],
    [
      /To reduce delays, send photos from inside and outside, approximate width\/height, business name, exact location, and whether the opening faces public sidewalk traffic\./gi,
      "To reduce delays, call with the approximate width and height, service location, access details, and whether the opening faces public sidewalk traffic.",
    ],
    [
      /Send photos of the closer body, arm, hinge side, and strike area\. Include when the issue occurs most often \(peak traffic, weather, or after-hours lockup\)\./gi,
      "During the call, describe the closer body, arm, hinge side, and strike area. Explain when the issue occurs most often, such as during peak traffic, weather changes, or after-hours lockup.",
    ],
    [/How do I request a quote\?/gi, "How do I discuss scheduled work?"],
    [/request a quote for scheduled service/gi, "call for scheduled service"],
    [/request a quote/gi, "call for service"],
    [/Call for a Quote/gi, "Call for Service"],
    [/For a quick quote, call/gi, "For scheduled service, call"],
    [/For the fastest quote, call/gi, "For the fastest next step, call"],
    [/Call 703-244-0559 for a Free Estimate/gi, "Call 703-244-0559 for Glass Door Installation"],
    [/Call for a Free Estimate: 703-244-0559/gi, "Call 703-244-0559 for Storefront Glass Repair"],
    [/Call for a free estimate on/gi, "Call to discuss"],
  ]);

  html = html.replace(/<h1\b(?![^>]*\bid=)([^>]*)>/i, '<h1 id="page-title" tabindex="-1"$1>');

  html = html.replace(/<body\b[^>]*>/i, (tag) => {
    const cleaned = tag
      .replace(/\s+data-service=(["'])[^"']*\1/gi, "")
      .replace(/\s+data-location=(["'])[^"']*\1/gi, "");
    return cleaned.replace(
      />$/,
      ` data-service="${serviceForFile(file)}" data-location="${locationForFile(file)}">`
    );
  });

  for (const [source, destination] of redirectMap) {
    html = html.replaceAll(`href="${source}"`, `href="${destination}"`);
    html = html.replaceAll(`href='${source}'`, `href="${destination}"`);
  }

  for (const imageName of [
    "storefront-gallery-01",
    "storefront-gallery-02",
    "storefront-gallery-07",
  ]) {
    html = html.replaceAll(
      `src="images/${imageName}.webp"`,
      `sizes="(max-width: 600px) 90vw, (max-width: 1200px) 45vw, 380px" src="images/${imageName}-768.webp" srcset="images/${imageName}-480.webp 480w, images/${imageName}-768.webp 768w"`
    );
  }
  for (const [source, imageName] of [
    ["board-up-storefront-panel.jpg", "board-up-storefront-panel"],
    ["emergency-board-up.webp", "emergency-board-up"],
    ["glass-cutting-workbench.jpg", "glass-cutting-workbench"],
  ]) {
    html = html.replaceAll(
      `src="images/${source}"`,
      `sizes="(max-width: 600px) 90vw, (max-width: 1200px) 45vw, 380px" src="images/${imageName}-768.webp" srcset="images/${imageName}-480.webp 480w, images/${imageName}-768.webp 768w"`
    );
  }

  html = html.replace(
    /\s*<a\b(?=[^>]*\bclass="[^"]*\bfloating-call\b)[^>]*>[^<]*<\/a>\s*/gi,
    "\n"
  );

  html = html.replace(
    /(?:\s*(?:or|\|)\s*|\s*<br\s*\/?>\s*)?<a\b(?=[^>]*href="tel:\+12026434062")[^>]*>[^<]*<\/a>/gi,
    ""
  );

  html = html.replace(
    /<a\b(?=[^>]*\bhref="#")[^>]*>\s*<i\b[^>]*>\s*<\/i>\s*<\/a>\s*/gi,
    ""
  );
  html = html.replace(
    /<i\b(?=[^>]*\bfa-tiktok\b)[^>]*>\s*<\/i>/gi,
    '<span aria-hidden="true" class="social-text">TikTok</span>'
  );

  html = html.replace(
    /<noscript>\s*<link\b(?=[^>]*font-awesome)[^>]*\/?>\s*<\/noscript>\s*/gi,
    ""
  );
  html = html.replace(
    /\s*<div\b(?=[^>]*\bclass=["'][^"']*\bpartner-links\b[^"']*["'])[^>]*>[\s\S]*?<\/div>/gi,
    ""
  );
  html = html.replace(
    /<link\b(?=[^>]*href="https:\/\/cdnjs\.cloudflare\.com)[^>]*\/?>\s*/gi,
    ""
  );

  html = html.replace(/<a\b[^>]*>/gi, (tag) => {
    const positions = [
      ...tag.matchAll(/\s+data-cta-position=(["'])([^"']+)\1/gi),
    ];
    const legacy = tag.match(/\s+data-cta-location=(["'])([^"']+)\1/i);
    if (!positions.length && !legacy) return tag;

    const rawValue = positions[0]?.[2] || legacy?.[2] || "";
    const mappedValue = dataPositionMap.get(rawValue.toLowerCase()) || rawValue;
    const cleaned = tag.replace(
      /\s+data-cta-(?:position|location)=(["'])[^"']*\1/gi,
      ""
    );
    return cleaned.replace(/\s*(\/?)>$/, ` data-cta-position="${mappedValue}"$1>`);
  });

  // Remove fields that imply an unverified public address or pricing claim.
  html = html.replace(/^\s*"priceRange":\s*"[^"]*",\s*\n/gm, "");
  html = html.replace(
    /^\s*"address":\s*\{\s*\n\s*"@type":\s*"PostalAddress",\s*\n\s*"addressLocality":\s*"[^"]+",\s*\n\s*"addressRegion":\s*"[^"]+",\s*\n\s*"addressCountry":\s*"[^"]+"\s*\n\s*\},\s*\n/gm,
    ""
  );

  if (!file.startsWith("emergency-")) {
    html = html.replace(
      /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>\s*/gi,
      (block) => (/"@type"\s*:\s*"EmergencyService"/i.test(block) ? "" : block)
    );
  }

  if (html !== original) {
    await writeFile(path, html);
    changedCount += 1;
  }
}

const identityFiles = ["llm.txt", "llms.txt", "llms-full.txt", ".well-known/llms.txt"];
for (const file of identityFiles) {
  const path = resolve(root, file);
  const original = await readFile(path, "utf8");
  const updated = replaceAll(original, [
    [/^.*Secondary phone:.*202-643-4062.*\n?/gim, ""],
    [/^- 202-643-4062\s*\n?/gm, ""],
    [/Phones:\s*\+1-703-244-0559,\s*\+1-202-643-4062/g, "Primary phone: +1-703-244-0559"],
    [/703-244-0559\s+(?:and|or|\/|\|)\s+202-643-4062/g, "703-244-0559"],
  ]);
  if (updated !== original) {
    await writeFile(path, updated);
    changedCount += 1;
  }
}

console.log(`Normalized ${changedCount} site files.`);
