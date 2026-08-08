export const canonicalOrigin = "https://www.dmv247glassrepair.com";
export const canonicalHost = "www.dmv247glassrepair.com";
export const apexHost = "dmv247glassrepair.com";

export const primaryPhone = Object.freeze({
  display: "703-244-0559",
  e164: "+17032440559",
});

export const retiredRedirects = Object.freeze([
  Object.freeze({
    source: "emergency-glass-repair.html",
    destination: "emergency-glass-repair-washington-dc.html",
  }),
  Object.freeze({
    source: "emergency-board-up.html",
    destination: "emergency-board-up-washington-dc.html",
  }),
  Object.freeze({
    source: "storefront-glass-repair.html",
    destination: "storefront-glass-repair-washington-dc.html",
  }),
  Object.freeze({
    source: "commercial-glass-repair-dc.html",
    destination: "commercial-glass-repair-washington-dc.html",
  }),
  Object.freeze({
    source: "washington-dc-commercial-glass.html",
    destination: "commercial-glass-repair-washington-dc.html",
  }),
]);

export const redirectMap = new Map(
  retiredRedirects.map(({ source, destination }) => [source, destination])
);

export const excludedHtmlFiles = new Set([
  "404.html",
  "google10f3f95e19031958.html",
]);

export const corePhonePages = new Set([
  "index.html",
  "emergency-glass-repair-washington-dc.html",
  "emergency-board-up-washington-dc.html",
  "storefront-glass-repair-washington-dc.html",
  "commercial-glass-repair-washington-dc.html",
  "commercial-door-repair-washington-dc.html",
  "glass-door-repair-washington-dc.html",
  "door-closer-repair-washington-dc.html",
]);

export const analyticsServices = new Set([
  "emergency-glass-repair",
  "emergency-board-up",
  "storefront-glass-repair",
  "commercial-glass-repair",
  "commercial-door-repair",
  "glass-door-repair",
  "glass-door-installation",
  "door-closer-repair",
  "door-hardware",
  "curtain-wall-glass-repair",
  "storefront-framing-repair",
  "tempered-glass-replacement",
  "insulated-glass-replacement",
  "energy-efficient-glass",
  "glass-partitions",
  "shower-door-repair",
  "residential-glass-repair",
  "locksmith-service",
  "safety-glazing",
  "multi-service",
  "site-information",
  "glass-repair",
]);

export const analyticsLocations = new Set([
  "washington-dc-dmv",
  "washington-dc",
  "arlington-va",
  "alexandria-va",
  "fairfax-va",
  "bethesda-md",
  "silver-spring-md",
  "rockville-md",
  "baltimore-md",
  "maryland",
  "northern-virginia",
  "dmv",
]);
