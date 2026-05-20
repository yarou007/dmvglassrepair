(() => {
  const PHONE_PRIMARY = "7032440559";
  const PHONE_SECONDARY = "2026434062";
  const QUOTE_ANCHOR = "#quote-request";

  const pushEvent = (eventName, payload = {}) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: eventName,
      ...payload,
    });
  };

  const navToggle = document.querySelector("[data-nav-toggle]");
  const navLinks = document.querySelector("[data-nav-links]");

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      const isOpen = document.body.classList.toggle("nav-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    navLinks.addEventListener("click", (e) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.tagName.toLowerCase() === "a") {
        document.body.classList.remove("nav-open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Ensure both phone numbers stay visible in the header CTA.
  if (navLinks) {
    const navCtas = navLinks.querySelectorAll(".nav-cta");
    if (navCtas.length === 1) {
      const cta = navCtas[0];
      const separator = document.createTextNode(" or ");
      const second = document.createElement("a");
      second.className = "nav-cta";
      second.href = "tel:2026434062";
      second.textContent = "202-643-4062";
      cta.parentElement?.append(separator, second);
    }
  }

  // Ensure both numbers are visible in the emergency bar.
  const emergencyBar = document.querySelector(".emergency-bar");
  if (emergencyBar && !emergencyBar.textContent?.includes("202-643-4062")) {
    const separator = document.createTextNode(" or ");
    const second = document.createElement("a");
    second.href = `tel:${PHONE_SECONDARY}`;
    second.textContent = "202-643-4062";
    emergencyBar.append(separator, second);
  }

  // Standardize media loading defaults.
  document.querySelectorAll("img").forEach((img) => {
    if (!img.hasAttribute("loading")) img.setAttribute("loading", "lazy");
    if (!img.hasAttribute("decoding")) img.setAttribute("decoding", "async");
  });

  // Add a quote CTA button on pages that only have the floating call CTA.
  const floatingCall = document.querySelector(".floating-call");

  if (floatingCall && !document.querySelector(".floating-quote")) {
    const quoteLink = document.createElement("a");
    quoteLink.className = "floating-quote";
    quoteLink.href = document.querySelector("#quote-request")
      ? "#quote-request"
      : "index.html#quote-request";
    quoteLink.textContent = "Get Quote";
    document.body.appendChild(quoteLink);
  }

  // Mobile sticky CTA bar for calls, quote requests, and text-photo intake.
  const createMobileStickyBar = () => {
    if (document.querySelector(".mobile-sticky-cta")) return;
    const sticky = document.createElement("section");
    sticky.className = "mobile-sticky-cta";
    sticky.setAttribute("aria-label", "Quick contact actions");
    sticky.innerHTML = `
      <a id="cta-call-sticky" class="mobile-sticky-item mobile-sticky-call" href="tel:${PHONE_PRIMARY}" data-cta-type="call" data-track-group="sticky">
        Call Now
      </a>
      <a id="cta-quote-sticky" class="mobile-sticky-item mobile-sticky-quote" href="${document.querySelector(QUOTE_ANCHOR) ? QUOTE_ANCHOR : "index.html#quote-request"}" data-cta-type="quote" data-track-group="sticky">
        Request Quote
      </a>
      <a id="cta-text-sticky" class="mobile-sticky-item mobile-sticky-text" href="sms:+1${PHONE_PRIMARY}?body=I%20need%20a%20glass%20repair%20quote.%20My%20city%20is%20" data-cta-type="text" data-track-group="sticky">
        Text Photos
      </a>
    `;
    document.body.appendChild(sticky);
  };

  createMobileStickyBar();

  // Tracking + GTM-friendly IDs/classes for critical lead actions.
  const navCall = document.querySelector(".nav-cta[href^='tel:']");
  if (navCall && !navCall.id) navCall.id = "cta-call-header";

  const heroCall = Array.from(document.querySelectorAll("a.btn-primary[href^='tel:']")).find((link) =>
    /call now|emergency/i.test(link.textContent || "")
  );
  if (heroCall && !heroCall.id) heroCall.id = "cta-call-hero";

  const heroQuote = Array.from(document.querySelectorAll("a.btn-secondary")).find((link) =>
    /quote/i.test(link.textContent || "")
  );
  if (heroQuote && !heroQuote.id) heroQuote.id = "cta-quote-hero";

  document.querySelectorAll("a[href^='tel:']").forEach((link) => {
    if (!link.dataset.ctaType) link.dataset.ctaType = "call";
    if (!link.dataset.trackGroup) link.dataset.trackGroup = "phone";
  });

  document.querySelectorAll("a[href*='#quote-request'], a[href*='index.html#quote-request']").forEach((link) => {
    if (!link.dataset.ctaType) link.dataset.ctaType = "quote";
    if (!link.dataset.trackGroup) link.dataset.trackGroup = "quote";
  });

  const quoteForm = document.querySelector(".quote-form");
  if (quoteForm) {
    quoteForm.id = quoteForm.id || "lead-quote-form";
    quoteForm.dataset.trackGroup = "quote-form";
    const submitBtn = quoteForm.querySelector("button[type='submit']");
    if (submitBtn && !submitBtn.id) submitBtn.id = "quote-form-submit";

    quoteForm.addEventListener("submit", () => {
      pushEvent("quote_form_submit", {
        form_id: quoteForm.id,
        page_path: window.location.pathname,
      });
    });
  }

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const link = target.closest("a");
    if (!link) return;

    const href = link.getAttribute("href") || "";
    if (href.startsWith("tel:")) {
      pushEvent("cta_call_click", {
        cta_id: link.id || "",
        cta_text: (link.textContent || "").trim(),
        cta_group: link.dataset.trackGroup || "",
        page_path: window.location.pathname,
      });
      return;
    }

    if (href.includes("#quote-request")) {
      pushEvent("cta_quote_click", {
        cta_id: link.id || "",
        cta_text: (link.textContent || "").trim(),
        cta_group: link.dataset.trackGroup || "",
        page_path: window.location.pathname,
      });
      return;
    }

    if (href.startsWith("sms:")) {
      pushEvent("cta_text_click", {
        cta_id: link.id || "",
        cta_text: (link.textContent || "").trim(),
        cta_group: link.dataset.trackGroup || "",
        page_path: window.location.pathname,
      });
    }
  });

  pushEvent("page_type_view", {
    page_path: window.location.pathname,
    page_type: window.location.pathname.includes("glass-repair-")
      ? "city-page"
      : window.location.pathname.includes("blog")
        ? "blog-page"
        : window.location.pathname.includes("washington-dc") || window.location.pathname.includes("dmv")
          ? "service-page"
          : "general-page",
  });

  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.querySelectorAll(".fade-in").forEach((el) => el.classList.add("visible"));
    return;
  }

  if (!("IntersectionObserver" in window)) {
    document.querySelectorAll(".fade-in").forEach((el) => el.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("visible");
    });
  }, { threshold: 0.1 });

  document.querySelectorAll(".fade-in").forEach((el) => observer.observe(el));
})();
