(() => {
  if (window.__capitalGlassDoorInitialized) return;
  window.__capitalGlassDoorInitialized = true;

  const SITE_CONFIG = Object.freeze({
    brand: "Capital Glass Door",
    primaryPhone: Object.freeze({
      display: "202-643-4062",
      e164: "+12026434062",
    }),
    whatsapp: Object.freeze({
      display: "703-244-0559",
      url: "https://wa.me/17032440559",
    }),
  });

  const CTA_POSITIONS = new Set([
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
  const SERVICES = new Set([
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
  const LOCATIONS = new Set([
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
  const CAMPAIGN_KEYS = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
  ];

  // A single shared source for dynamic telephone UI and analytics metadata.
  window.CapitalGlassDoor = SITE_CONFIG;

  const navToggle = document.querySelector("[data-nav-toggle]");
  const navLinks = document.querySelector("[data-nav-links]");

  const closeNavigation = () => {
    document.body.classList.remove("nav-open");
    navToggle?.setAttribute("aria-expanded", "false");
  };

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      const isOpen = document.body.classList.toggle("nav-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    navLinks.addEventListener("click", (event) => {
      if (event.target instanceof Element && event.target.closest("a")) {
        closeNavigation();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && document.body.classList.contains("nav-open")) {
        closeNavigation();
        navToggle.focus();
      }
    });
  }

  const slugify = (value) =>
    String(value || "")
      .toLowerCase()
      .trim()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const inferService = () => {
    if (SERVICES.has(document.body.dataset.service)) return document.body.dataset.service;
    const path = window.location.pathname.toLowerCase();
    const servicePatterns = [
      ["emergency-board-up", "emergency-board-up"],
      ["storefront", "storefront-glass-repair"],
      ["door-closer", "door-closer-repair"],
      ["commercial-door", "commercial-door-repair"],
      ["glass-door-installation", "glass-door-installation"],
      ["glass-door", "glass-door-repair"],
      ["commercial-glass", "commercial-glass-repair"],
      ["emergency-glass", "emergency-glass-repair"],
      ["shower", "shower-door-repair"],
      ["residential", "residential-glass-repair"],
      ["tempered", "tempered-glass-replacement"],
      ["locksmith", "locksmith-service"],
    ];
    const match = servicePatterns.find(([pattern]) => path.includes(pattern));
    return match?.[1] || (path === "/" || path.endsWith("/index.html")
      ? "emergency-glass-repair"
      : slugify(document.querySelector("h1")?.textContent) || "glass-repair");
  };

  const inferLocation = () => {
    if (LOCATIONS.has(document.body.dataset.location)) return document.body.dataset.location;
    const path = window.location.pathname.toLowerCase();
    const locationPattern = path.match(
      /(washington-dc|arlington-va|alexandria-va|fairfax-va|bethesda-md|silver-spring-md|rockville-md|baltimore(?:-md)?)/
    );
    if (locationPattern) return locationPattern[1].replace("baltimore", "baltimore-md");
    if (path.includes("northern-virginia")) return "northern-virginia";
    if (path.includes("maryland")) return "maryland";
    return path === "/" || path.endsWith("/index.html") ? "washington-dc-dmv" : "dmv";
  };

  const PAGE_CONTEXT = Object.freeze({
    service: inferService(),
    location: inferLocation(),
  });

  const humanize = (value) =>
    value
      .split("-")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const normalizeLegacyPosition = (value) => {
    const map = {
      "header-nav": "header",
      "header-nav-secondary": "header",
      "sticky-mobile": "sticky_mobile",
      "top-bar": "emergency_banner",
      "bottom-cta": "final_cta",
      content: "mid_page",
      "floating-call": "final_cta",
    };
    return map[value] || value;
  };

  const inferCtaPosition = (link) => {
    const declared = normalizeLegacyPosition(
      link.dataset.ctaPosition || link.dataset.ctaLocation || ""
    );
    if (CTA_POSITIONS.has(declared)) return declared;
    if (link.classList.contains("mobile-call-sticky")) return "sticky_mobile";
    if (link.closest("nav")) return "header";
    if (link.closest(".hero, .page-hero")) return "hero";
    if (link.closest(".emergency-bar, .quick-emergency-cta")) return "emergency_banner";
    if (link.closest(".cta-section")) return "final_cta";
    if (link.closest("footer")) return "footer";
    if (link.closest("[aria-label*='Frequently'], .faq-section")) return "before_faq";
    if (link.closest("main section:first-child")) return "after_intro";
    return "mid_page";
  };

  const ensureContactLinkMeta = (link) => {
    const service = SERVICES.has(link.dataset.service)
      ? link.dataset.service
      : PAGE_CONTEXT.service;
    const location = LOCATIONS.has(link.dataset.location)
      ? link.dataset.location
      : PAGE_CONTEXT.location;
    const ctaPosition = inferCtaPosition(link);

    link.dataset.ctaPosition = ctaPosition;
    link.dataset.service = service;
    link.dataset.location = location;
    link.removeAttribute("data-cta-location");

    const number = (link.getAttribute("href") || "").replace(/^tel:/i, "");
    const isWhatsapp = link.getAttribute("href") === SITE_CONFIG.whatsapp.url;
    const displayNumber = isWhatsapp
      ? SITE_CONFIG.whatsapp.display
      : number === SITE_CONFIG.primaryPhone.e164
      ? SITE_CONFIG.primaryPhone.display
      : number;
    link.dataset.visibleNumber = displayNumber;
    link.setAttribute(
      "aria-label",
      `${isWhatsapp ? "Message" : "Call"} ${SITE_CONFIG.brand} ${isWhatsapp ? "on WhatsApp" : "at"} ${displayNumber} for ${humanize(service)}`
    );
  };

  const safeSessionGet = (key) => {
    try {
      return window.sessionStorage.getItem(key);
    } catch {
      return null;
    }
  };

  const safeSessionSet = (key, value) => {
    try {
      window.sessionStorage.setItem(key, value);
    } catch {
      // Storage can be unavailable in private or restricted browsing contexts.
    }
  };

  const cleanCampaignValue = (value) => {
    if (typeof value !== "string") return "";
    const cleaned = value.trim().slice(0, 64);
    if (!/^[a-z0-9][a-z0-9._~-]{0,63}$/i.test(cleaned)) return "";
    if (/(?:\d[ .()_-]*){7,}/.test(cleaned)) return "";
    if (/(?:^|[._~-])(?:street|st|road|rd|avenue|ave|boulevard|blvd|lane|ln|drive|dr|court|ct|highway|hwy|suite|unit)(?:$|[._~-])/i.test(cleaned)) return "";
    return cleaned;
  };

  const sanitizeAttribution = (value) => {
    const source = value && typeof value === "object" ? value : {};
    const sanitized = Object.fromEntries(
      CAMPAIGN_KEYS
        .map((name) => [name, cleanCampaignValue(source[name])])
        .filter(([, campaignValue]) => campaignValue)
    );
    sanitized.has_gclid = source.has_gclid === true;
    sanitized.has_gbraid = source.has_gbraid === true;
    sanitized.has_wbraid = source.has_wbraid === true;
    return sanitized;
  };

  const getAttribution = () => {
    const key = "cgd_call_attribution_v1";
    const params = new URLSearchParams(window.location.search);
    const current = sanitizeAttribution(Object.fromEntries(
      CAMPAIGN_KEYS
        .map((name) => [name, cleanCampaignValue(params.get(name))])
        .filter(([, value]) => value)
        .concat([
          ["has_gclid", params.has("gclid")],
          ["has_gbraid", params.has("gbraid")],
          ["has_wbraid", params.has("wbraid")],
        ])));

    if (Object.entries(current).some(([name, value]) => name.startsWith("utm_") || value)) {
      safeSessionSet(key, JSON.stringify(current));
      return current;
    }

    const storedValue = safeSessionGet(key);
    if (!storedValue) return current;

    try {
      const stored = JSON.parse(storedValue);
      return sanitizeAttribution(stored);
    } catch {
      return current;
    }
  };

  const getLandingPage = () => {
    const key = "cgd_landing_page_v1";
    const existing = safeSessionGet(key);
    if (existing && /^\/[a-z0-9/_-]*(?:\.html)?$/i.test(existing)) return existing;
    const landingPage = window.location.pathname || "/";
    safeSessionSet(key, landingPage);
    return landingPage;
  };

  const getInitialReferrerDomain = () => {
    const key = "cgd_initial_referrer_v1";
    const stored = safeSessionGet(key);
    if (stored && /^(?:[a-z0-9-]+\.)*[a-z0-9-]+$/i.test(stored)) return stored;
    if (!document.referrer) return "";
    try {
      const referrer = new URL(document.referrer);
      if (referrer.origin === window.location.origin) return "";
      const hostname = referrer.hostname.toLowerCase().slice(0, 253);
      if (!/^(?:[a-z0-9-]+\.)*[a-z0-9-]+$/i.test(hostname)) return "";
      safeSessionSet(key, hostname);
      return hostname;
    } catch {
      return "";
    }
  };

  const PAGE_ATTRIBUTION = Object.freeze(getAttribution());
  const LANDING_PAGE = getLandingPage();
  const REFERRER_DOMAIN = getInitialReferrerDomain();

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest('a[href^="tel:"], a.whatsapp-cta');
    if (!link) return;
    const isWhatsapp = link.getAttribute("href") === SITE_CONFIG.whatsapp.url;
    if (!isWhatsapp && !link.getAttribute("href")?.startsWith("tel:")) return;

    ensureContactLinkMeta(link);
    if (typeof window.gtag !== "function") return;

    const eventParameters = {
      page_path: window.location.pathname || "/",
      page_title: document.title,
      service: link.dataset.service,
      location: link.dataset.location,
      cta_position: link.dataset.ctaPosition,
      visible_number: link.dataset.visibleNumber,
      landing_page: LANDING_PAGE,
      ...PAGE_ATTRIBUTION,
    };
    if (REFERRER_DOMAIN) eventParameters.referrer_domain = REFERRER_DOMAIN;

    try {
      window.gtag("event", isWhatsapp ? "whatsapp_click" : "phone_click", eventParameters);
    } catch {
      // Analytics must never prevent or delay the native telephone action.
    }
  });

  document.querySelectorAll('a[href^="tel:"], a.whatsapp-cta').forEach(ensureContactLinkMeta);
  document.querySelectorAll("img").forEach((img) => {
    if (!img.hasAttribute("loading")) img.setAttribute("loading", "lazy");
    if (!img.hasAttribute("decoding")) img.setAttribute("decoding", "async");
  });
})();
