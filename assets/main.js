(() => {
  const PHONE_PRIMARY = "+17032440559";

  const navToggle = document.querySelector("[data-nav-toggle]");
  const navLinks = document.querySelector("[data-nav-links]");

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      const isOpen = document.body.classList.toggle("nav-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    navLinks.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.closest("a")) {
        document.body.classList.remove("nav-open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  const createMobileStickyCall = () => {
    if (document.querySelector(".mobile-call-sticky")) return;
    const sticky = document.createElement("a");
    sticky.className = "mobile-call-sticky";
    sticky.href = `tel:${PHONE_PRIMARY}`;
    sticky.textContent = "Call Now";
    sticky.setAttribute("data-cta-location", "sticky-mobile");
    sticky.setAttribute(
      "aria-label",
      "Call Capital Glass Door at 703-244-0559 for emergency glass repair"
    );
    document.body.appendChild(sticky);
  };

  const inferCtaLocation = (link) => {
    if (link.dataset.ctaLocation) return link.dataset.ctaLocation;
    if (link.classList.contains("mobile-call-sticky")) return "sticky-mobile";
    if (link.classList.contains("floating-call")) return "floating-call";
    if (link.classList.contains("nav-cta")) return "header-nav";
    if (link.closest(".hero, .page-hero")) return "hero";
    if (link.closest(".emergency-bar")) return "top-bar";
    if (link.closest(".cta-section")) return "bottom-cta";
    if (link.closest("footer")) return "footer";
    return "content";
  };

  const normalizePhoneForEvent = (href) => href.replace(/^tel:/i, "");

  const ensurePhoneLinkMeta = () => {
    document.querySelectorAll('a[href^="tel:"]').forEach((link) => {
      const href = link.getAttribute("href") || "";
      const number = normalizePhoneForEvent(href);
      if (!link.dataset.ctaLocation) {
        link.dataset.ctaLocation = inferCtaLocation(link);
      }
      if (!link.hasAttribute("aria-label")) {
        const spoken = number
          .replace(/^\+1/, "")
          .replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
        link.setAttribute(
          "aria-label",
          `Call Capital Glass Door at ${spoken} for emergency glass repair`
        );
      }
    });
  };

  const trackPhoneCalls = () => {
    document.querySelectorAll('a[href^="tel:"]').forEach((link) => {
      link.addEventListener("click", () => {
        if (typeof gtag !== "function") return;
        gtag("event", "phone_call_click", {
          phone_number: normalizePhoneForEvent(link.getAttribute("href") || ""),
          page_path: window.location.pathname,
          link_text: (link.textContent || "").trim(),
          cta_location: link.dataset.ctaLocation || "unknown",
        });
      });
    });
  };

  // Keep image defaults lightweight and safe for static pages.
  document.querySelectorAll("img").forEach((img) => {
    if (!img.hasAttribute("loading")) img.setAttribute("loading", "lazy");
    if (!img.hasAttribute("decoding")) img.setAttribute("decoding", "async");
  });

  createMobileStickyCall();
  ensurePhoneLinkMeta();
  trackPhoneCalls();

  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.querySelectorAll(".fade-in").forEach((el) => el.classList.add("visible"));
    return;
  }

  if (!("IntersectionObserver" in window)) {
    document.querySelectorAll(".fade-in").forEach((el) => el.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("visible");
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll(".fade-in").forEach((el) => observer.observe(el));
})();
