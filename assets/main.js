(() => {
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
    second.href = "tel:2026434062";
    second.textContent = "202-643-4062";
    emergencyBar.append(separator, second);
  }

  // Add a quote CTA button on pages that only have the floating call CTA.
  const floatingCall = document.querySelector(".floating-call");
  if (
    floatingCall &&
    window.matchMedia &&
    window.matchMedia("(max-width: 600px)").matches
  ) {
    floatingCall.textContent = "Call Now";
  }

  if (floatingCall && !document.querySelector(".floating-quote")) {
    const quoteLink = document.createElement("a");
    quoteLink.className = "floating-quote";
    quoteLink.href = document.querySelector("#quote-request")
      ? "#quote-request"
      : "index.html#quote-request";
    quoteLink.textContent = "Get Quote";
    document.body.appendChild(quoteLink);
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
