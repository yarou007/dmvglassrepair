import {
  canonicalOrigin,
  retiredRedirects,
} from "./site-config.mjs";

const marker = "cgd_redirect_check=1";
const permanentStatuses = new Set([301, 308]);
const checks = [
  {
    label: "canonical /index.html",
    source: `${canonicalOrigin}/index.html?${marker}`,
    destination: `${canonicalOrigin}/?${marker}`,
  },
  ...retiredRedirects.map(({ source, destination }) => ({
    label: `retired /${source}`,
    source: `${canonicalOrigin}/${source}?${marker}`,
    destination: `${canonicalOrigin}/${destination}?${marker}`,
  })),
  ...[
    "http://dmv247glassrepair.com",
    "http://www.dmv247glassrepair.com",
    "https://dmv247glassrepair.com",
  ].map((origin) => ({
    label: `host/scheme ${origin}`,
    source: `${origin}/robots.txt?${marker}`,
    destination: `${canonicalOrigin}/robots.txt?${marker}`,
  })),
];

const errors = [];
for (const check of checks) {
  let response;
  try {
    response = await fetch(check.source, { redirect: "manual" });
  } catch (error) {
    errors.push(`${check.label}: request failed (${error.message})`);
    continue;
  }
  const location = response.headers.get("location");
  const resolvedLocation = location ? new URL(location, check.source).href : "";
  if (!permanentStatuses.has(response.status)) {
    errors.push(`${check.label}: expected 301/308, received ${response.status}`);
  }
  if (resolvedLocation !== check.destination) {
    errors.push(`${check.label}: expected ${check.destination}, received ${resolvedLocation || "no Location header"}`);
  }
}

if (errors.length) {
  console.error(`Live redirect validation failed with ${errors.length} error(s):`);
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Live redirect validation passed for ${checks.length} one-hop redirects.`);
}
