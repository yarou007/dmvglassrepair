# Mobile call and WhatsApp update

Updated November 15, 2026. The checkout was clean before this change.

## Contact behavior

- All direct calls use `tel:+12026434062`, displayed as `202-643-4062`.
- WhatsApp remains separate: `https://wa.me/17032440559`, at `703-244-0559`.
- Page heroes, final contact sections, and footers offer WhatsApp alongside calls. The mobile contact bar contains both channels in static HTML, including when JavaScript is disabled.
- The mobile bar has safe-area spacing, page-bottom clearance, and distinct touch targets. It hides when the navigation menu is open and above the mobile breakpoint.
- No forms, email actions, SMS links, or new conversion services were added.
- Calls emit `phone_click`; WhatsApp emits `whatsapp_click`. Neither event proves a connected call, delivered message, or booked job. Analytics does not block contact navigation.

## City content and SEO

The existing Washington DC, Arlington, Alexandria, Fairfax, Bethesda, Silver Spring, Rockville, and Baltimore pages now describe neighborhood and street references, loading access, shared entrances, and property-management coordination. Coverage and timing are confirmed by exact address. No offices, customer reviews, project histories, or neighborhood response guarantees were added.

Existing canonical URLs, redirects, titles, and FAQ content remain. Structured-data telephone numbers and LLM contact references use the direct-call number; WhatsApp is identified separately. Sitemap dates reflect this material update. The privacy notice describes external WhatsApp messaging and link analytics.

## Validation

From the repository root:

```sh
node scripts/validate-site.mjs
node --check assets/main.js
CGD_CHROMEDRIVER=/workspace/.tools/dmvglassrepair/usr/bin/chromedriver \
  /workspace/.venvs/dmvglassrepair/bin/python scripts/browser_smoke.py
```

The browser runner starts its own loopback HTTP server. It requires Selenium and a working Chromium/Chrome plus a matching ChromeDriver; `CGD_CHROME_BINARY` and `CGD_CHROMEDRIVER` can select existing binaries. It tests contact URLs and analytics without launching a device dialer or sending a WhatsApp message.

Validation covers 64 indexable pages. Browser checks cover eight core pages and all eight city pages at 320, 360, 390, 600, 768, 769, and 1366 pixels, plus menu/Escape behavior, attribution sanitization, hero layout, footer clearance, and contacts with JavaScript disabled. A complete HTML contact audit covered 70 pages: 575 direct-call links, 261 WhatsApp links, and no form, email, or SMS actions. The normalizer is idempotent and preserves the separate WhatsApp destination.

The SEO validator retains its existing reminders to verify advertised 24/7 business availability. Production Vercel routing and actual device call/WhatsApp handoffs require deployment and device checks; no deployment was performed.
