# Call and WhatsApp click analytics

Capital Glass Door uses the existing GA4 property `G-7ZE9DVWNFN`. The base GA4 tag remains in the page heads; `assets/main.js` adds one delegated click listener for every current or future `a[href^="tel:"]` or `.whatsapp-cta` link. Direct calls use `+12026434062`; WhatsApp uses the separate destination `https://wa.me/17032440559`.

## Event

- Event name: `phone_click`
- Meaning: a visitor activated a business telephone link. This is an intent signal, not proof of a connected or qualified call.
- The listener does not call `preventDefault`, wait for GA, or alter the native `tel:` navigation.
- If `gtag` is missing or blocked, the telephone link continues normally.

Parameters sent when available:

- `page_path` (path only; no query string)
- `page_title`
- `service`
- `location`
- `cta_position`
- `visible_number`
- `landing_page` (first path in the current tab session)
- `referrer_domain` (the first external hostname in the tab session; same-site referrers are omitted)
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_term`
- `utm_content` (UTM values are accepted only in a restricted, non-space campaign-token format and are re-sanitized when read from session storage)
- `has_gclid`, `has_gbraid`, and `has_wbraid` (presence booleans only; click-ID values are never sent)

Allowed `cta_position` values are `header`, `hero`, `after_intro`, `mid_page`, `before_faq`, `final_cta`, `footer`, `sticky_mobile`, and `emergency_banner`.

No form, callback, text-message, photo-upload, `qualified_phone_call`, or `booked_job` event is implemented. Those outcome events require a future call-tracking or CRM offline-conversion integration.

WhatsApp links emit `whatsapp_click` with the same controlled context and `visible_number: "703-244-0559"`. This records messaging intent only; it does not confirm message delivery or a conversation. Analytics never prevents navigation, and both contact choices are present in the HTML when JavaScript is unavailable.

## Mark `phone_click` as a GA4 key event

An Analytics user with sufficient property access can open GA4 **Admin → Data display → Events**. After the property receives `phone_click`, find it under recent events and select the star. To register it before the first event arrives, select **Create event**, enter `phone_click` exactly, and mark it as a key event in that flow.

Google's current instructions are maintained in [Mark events as key events](https://support.google.com/analytics/answer/13128484).

Treat the key event as telephone intent in reporting. Do not rename it to or report it as a qualified call.

## Reporting dimensions

To use custom parameters in standard GA4 reports or Explorations, create event-scoped custom dimensions under **Admin → Data display → Custom definitions**. The most useful first dimensions are `service`, `location`, `cta_position`, and `landing_page`. Do not register or collect personal information.

## QA

1. In GA4 DebugView or with a local `gtag` stub, click a telephone link once, including a click on nested text or an icon.
2. Confirm exactly one `phone_click` event and a supported `cta_position`.
3. Test a URL with UTM parameters and dummy click-ID parameters; confirm only click-ID presence booleans are sent.
4. Block the GA script or remove the test `gtag` stub and confirm the same telephone link still opens the device's dial action.

5. Activate a WhatsApp link and confirm exactly one `whatsapp_click`, no `phone_click`, and the preserved 703 destination.
