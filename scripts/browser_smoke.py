#!/usr/bin/env python3
"""Headless browser checks for shared call, analytics, menu, and responsive behavior."""

import os
import re
import shutil
import subprocess
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
from pathlib import Path
from tempfile import TemporaryDirectory, gettempdir

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.selenium_manager import SeleniumManager
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait


ROOT = Path(__file__).resolve().parent.parent
BASE_URL = ""
CORE_PAGES = [
    "index.html",
    "emergency-glass-repair-washington-dc.html",
    "storefront-glass-repair-washington-dc.html",
    "emergency-board-up-washington-dc.html",
    "commercial-glass-repair-washington-dc.html",
    "commercial-door-repair-washington-dc.html",
    "glass-door-repair-washington-dc.html",
    "door-closer-repair-washington-dc.html",
]
CITY_PAGES = [
    "glass-repair-washington-dc.html",
    "glass-repair-arlington-va.html",
    "glass-repair-alexandria-va.html",
    "glass-repair-fairfax-va.html",
    "glass-repair-bethesda-md.html",
    "glass-repair-silver-spring-md.html",
    "glass-repair-rockville-md.html",
    "baltimore-glass-door-locksmith.html",
]
ALLOWED_POSITIONS = {
    "header",
    "hero",
    "after_intro",
    "mid_page",
    "before_faq",
    "final_cta",
    "footer",
    "sticky_mobile",
    "emergency_banner",
}


def check(condition, message):
    if not condition:
        raise AssertionError(message)


def local_url(file_name, query=""):
    return f"{BASE_URL}/{file_name}{query}"


def executable_version(path):
    """Return a tool's version string, or None when its launcher is unusable."""
    try:
        result = subprocess.run(
            [str(path), "--version"],
            capture_output=True,
            check=False,
            text=True,
            timeout=10,
        )
    except (OSError, subprocess.SubprocessError):
        return None
    version = (result.stdout or result.stderr).strip()
    return version if result.returncode == 0 and version else None


def find_chrome():
    """Prefer an explicit override, then the first Chrome-family binary that runs."""
    candidates = []
    override = os.environ.get("CGD_CHROME_BINARY")
    if override:
        candidates.append(Path(override))
    for name in ("google-chrome", "google-chrome-stable", "chromium", "chromium-browser"):
        if discovered := shutil.which(name):
            candidates.append(Path(discovered))

    checked = set()
    for candidate in candidates:
        key = str(candidate)
        if key in checked or not candidate.is_file():
            continue
        checked.add(key)
        if version := executable_version(candidate):
            return candidate, version

    raise RuntimeError(
        "No working Chrome-family browser found. Set CGD_CHROME_BINARY to an executable browser path."
    )


def find_chromedriver(browser_path):
    """Resolve a matching driver while ignoring stale or broken PATH shims."""
    override = os.environ.get("CGD_CHROMEDRIVER")
    if override:
        driver_path = Path(override)
        version = executable_version(driver_path)
        if not driver_path.is_file() or not version:
            raise RuntimeError("CGD_CHROMEDRIVER does not point to a working executable.")
        return driver_path, version

    cache_path = Path(
        os.environ.get("CGD_SELENIUM_CACHE", str(Path(gettempdir()) / "cgd-selenium-cache"))
    )
    result = SeleniumManager().binary_paths(
        [
            "--browser",
            "chrome",
            "--browser-path",
            str(browser_path),
            "--cache-path",
            str(cache_path),
            "--avoid-browser-download",
            "--skip-driver-in-path",
            "--avoid-stats",
        ]
    )
    driver_path = Path(result["driver_path"])
    version = executable_version(driver_path)
    if not driver_path.is_file() or not version:
        raise RuntimeError("Selenium Manager did not provide a working ChromeDriver.")
    return driver_path, version


def version_major(version):
    match = re.search(r"\b(\d+)\.", version)
    return match.group(1) if match else None


def main():
    browser_path, browser_version = find_chrome()
    driver_path, driver_version = find_chromedriver(browser_path)
    browser_major = version_major(browser_version)
    driver_major = version_major(driver_version)
    if browser_major and driver_major and browser_major != driver_major:
        raise RuntimeError(
            f"Browser/driver major-version mismatch: {browser_version} vs {driver_version}"
        )

    print(f"Browser: {browser_path} ({browser_version})")
    print(f"Driver: {driver_path} ({driver_version})")

    options = Options()
    options.binary_location = str(browser_path)
    options.page_load_strategy = "eager"
    for argument in [
        "--headless=new",
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--disable-background-networking",
        "--disable-breakpad",
        "--disable-crash-reporter",
        "--disable-extensions",
        "--host-resolver-rules=MAP * 0.0.0.0",
        "--window-size=390,844",
    ]:
        options.add_argument(argument)
    options.set_capability("goog:loggingPrefs", {"browser": "ALL"})

    with TemporaryDirectory(prefix="cgd-chrome-") as profile:
        options.add_argument(f"--user-data-dir={profile}")
        driver = webdriver.Chrome(service=Service(str(driver_path)), options=options)
        try:
            driver.set_page_load_timeout(20)
            driver.set_window_size(390, 844)
            driver.get(
                local_url(
                    "index.html",
                    "?utm_source=test&utm_medium=cpc&utm_campaign=phone-test&gclid=dummy-click-id",
                )
            )
            wait = WebDriverWait(driver, 10)
            wait.until(lambda current: current.execute_script("return document.readyState") in {"interactive", "complete"})
            wait.until(lambda current: len(current.find_elements(By.CSS_SELECTOR, ".mobile-call-sticky")) == 1)

            sticky = driver.find_element(By.CSS_SELECTOR, ".mobile-call-sticky")
            sticky_state = driver.execute_script(
                """
                const link = arguments[0];
                const rect = link.getBoundingClientRect();
                const style = getComputedStyle(link);
                return {
                  display: style.display,
                  width: rect.width,
                  height: rect.height,
                  aria: link.getAttribute('aria-label'),
                  href: link.getAttribute('href'),
                  position: link.dataset.ctaPosition,
                  animation: style.animationName,
                  bodyPadding: parseFloat(getComputedStyle(document.body).paddingBottom),
                  overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
                };
                """,
                sticky,
            )
            check(sticky_state["display"] == "flex", "mobile sticky CTA is not visible")
            check(sticky_state["width"] >= 44 and sticky_state["height"] >= 44, "sticky CTA target is below 44px")
            check("202-643-4062" in sticky_state["aria"], "sticky accessible name lacks the phone number")
            check(sticky_state["href"] == "tel:+12026434062", "sticky tel destination is incorrect")
            check(sticky_state["position"] == "sticky_mobile", "sticky analytics position is incorrect")
            check(sticky_state["animation"] == "none", "sticky CTA has an intrusive animation")
            check(sticky_state["bodyPadding"] >= 88, "mobile content lacks sticky-CTA clearance")
            check(sticky_state["overflow"] <= 1, "mobile page has horizontal overflow")

            toggle = driver.find_element(By.CSS_SELECTOR, "[data-nav-toggle]")
            toggle.click()
            check(toggle.get_attribute("aria-expanded") == "true", "mobile menu did not expose expanded state")
            check(driver.execute_script("return getComputedStyle(arguments[0]).display", sticky) == "none", "sticky CTA overlaps the open mobile menu")
            toggle.send_keys(Keys.ESCAPE)
            check(toggle.get_attribute("aria-expanded") == "false", "Escape did not close the mobile menu")
            check(driver.switch_to.active_element == toggle, "Escape did not restore focus to the menu button")

            analytics = driver.execute_script(
                """
                window.__phoneEvents = [];
                window.gtag = (...args) => window.__phoneEvents.push(args);
                const link = document.querySelector('#cta-call-hero');
                const nested = document.createElement('span');
                nested.textContent = link.textContent;
                link.textContent = '';
                link.appendChild(nested);
                const event = new Event('click', {bubbles: true, cancelable: true});
                nested.dispatchEvent(event);
                return {calls: window.__phoneEvents, defaultPrevented: event.defaultPrevented};
                """
            )
            check(not analytics["defaultPrevented"], "analytics prevented the native telephone action")
            check(len(analytics["calls"]) == 1, "one telephone click did not produce exactly one GA call")
            event_call = analytics["calls"][0]
            check(event_call[0:2] == ["event", "phone_click"], "phone_click event name is incorrect")
            parameters = event_call[2]
            check(parameters["cta_position"] == "hero", "hero CTA position was not preserved")
            check(parameters["service"] == "emergency-glass-repair", "homepage service context is incorrect")
            check(parameters["location"] == "washington-dc-dmv", "homepage location context is incorrect")
            check(parameters["visible_number"] == "202-643-4062", "visible_number is incorrect")
            check(parameters["utm_source"] == "test" and parameters["utm_medium"] == "cpc", "UTM attribution is missing")
            check(parameters["has_gclid"] is True, "gclid presence flag is missing")
            check("gclid" not in parameters, "raw gclid value leaked into analytics")
            check("?" not in parameters["landing_page"] and "?" not in parameters["page_path"], "query data leaked into path fields")
            check(parameters["cta_position"] in ALLOWED_POSITIONS, "unsupported CTA position was emitted")

            blocked = driver.execute_script(
                """
                window.gtag = undefined;
                const link = document.querySelector('#cta-call-hero');
                const event = new Event('click', {bubbles: true, cancelable: true});
                link.dispatchEvent(event);
                return event.defaultPrevented;
                """
            )
            check(not blocked, "missing analytics blocked the native telephone action")

            driver.execute_cdp_cmd(
                "Page.addScriptToEvaluateOnNewDocument",
                {
                    "source": """
                    Object.defineProperty(Document.prototype, 'referrer', {
                      configurable: true,
                      get() {
                        return new URL('index.html', window.location.href).href;
                      },
                    });
                    """
                },
            )
            driver.execute_script(
                """
                sessionStorage.setItem(
                  'cgd_call_attribution_v1',
                  JSON.stringify(arguments[0]),
                );
                sessionStorage.setItem('cgd_initial_referrer_v1', 'search.example');
                """,
                {
                    "utm_source": "paid search",
                    "utm_medium": "owner@example.com",
                    "utm_campaign": "202-643-4062",
                    "utm_term": "123 Main Street",
                    "utm_content": "invalid value",
                    "has_gclid": "true",
                },
            )
            driver.get(local_url("index.html"))
            wait.until(lambda current: len(current.find_elements(By.CSS_SELECTOR, ".mobile-call-sticky")) == 1)
            stored_attribution = driver.execute_script(
                """
                window.__phoneEvents = [];
                window.gtag = (...args) => window.__phoneEvents.push(args);
                const event = new Event('click', {bubbles: true, cancelable: true});
                document.querySelector('#cta-call-hero').dispatchEvent(event);
                return {
                  calls: window.__phoneEvents,
                  sameOriginReferrer:
                    Boolean(document.referrer) &&
                    new URL(document.referrer).origin === window.location.origin,
                };
                """
            )
            check(
                stored_attribution["sameOriginReferrer"],
                "referrer regression did not exercise a same-origin document referrer",
            )
            check(
                len(stored_attribution["calls"]) == 1,
                "tampered attribution test did not emit exactly one phone_click",
            )
            stored_parameters = stored_attribution["calls"][0][2]
            for campaign_key in (
                "utm_source",
                "utm_medium",
                "utm_campaign",
                "utm_term",
                "utm_content",
            ):
                check(
                    campaign_key not in stored_parameters,
                    f"tampered {campaign_key} escaped session-storage sanitization",
                )
            check(
                stored_parameters["has_gclid"] is False,
                "non-boolean stored click-ID presence escaped sanitization",
            )
            check(
                stored_parameters.get("referrer_domain") == "search.example",
                "stored initial external referrer hostname was not emitted",
            )

            driver.execute_script("sessionStorage.removeItem('cgd_initial_referrer_v1')")
            driver.get(local_url("index.html"))
            wait.until(lambda current: len(current.find_elements(By.CSS_SELECTOR, ".mobile-call-sticky")) == 1)
            same_origin_referrer = driver.execute_script(
                """
                window.__phoneEvents = [];
                window.gtag = (...args) => window.__phoneEvents.push(args);
                const event = new Event('click', {bubbles: true, cancelable: true});
                document.querySelector('#cta-call-hero').dispatchEvent(event);
                return {
                  calls: window.__phoneEvents,
                  sameOriginReferrer:
                    Boolean(document.referrer) &&
                    new URL(document.referrer).origin === window.location.origin,
                };
                """
            )
            check(
                same_origin_referrer["sameOriginReferrer"],
                "same-origin referrer omission test did not exercise the expected referrer",
            )
            check(
                len(same_origin_referrer["calls"]) == 1,
                "same-origin referrer test did not emit exactly one phone_click",
            )
            check(
                "referrer_domain" not in same_origin_referrer["calls"][0][2],
                "same-origin document referrer was substituted for the initial external referrer",
            )

            for desktop_width in (961, 1024, 1200):
                driver.set_window_size(desktop_width, 900)
                hero_layout = driver.execute_script(
                    """
                    const content = document.querySelector('.hero-content');
                    const media = document.querySelector('.hero-media');
                    const contentRect = content.getBoundingClientRect();
                    const mediaRect = media.getBoundingClientRect();
                    const mediaStyle = getComputedStyle(media);
                    const overlapWidth = Math.max(
                      0,
                      Math.min(contentRect.right, mediaRect.right) -
                        Math.max(contentRect.left, mediaRect.left),
                    );
                    const overlapHeight = Math.max(
                      0,
                      Math.min(contentRect.bottom, mediaRect.bottom) -
                        Math.max(contentRect.top, mediaRect.top),
                    );
                    return {
                      viewportWidth: document.documentElement.clientWidth,
                      mediaVisible:
                        mediaStyle.display !== 'none' &&
                        mediaStyle.visibility !== 'hidden' &&
                        mediaRect.width > 0 &&
                        mediaRect.height > 0,
                      overlapWidth,
                      overlapHeight,
                      overflow:
                        document.documentElement.scrollWidth -
                        document.documentElement.clientWidth,
                    };
                    """
                )
                check(
                    hero_layout["overflow"] <= 1,
                    f"homepage has horizontal overflow at {desktop_width}px",
                )
                if hero_layout["mediaVisible"]:
                    check(
                        not (
                            hero_layout["overlapWidth"] > 0.5
                            and hero_layout["overlapHeight"] > 0.5
                        ),
                        (
                            "homepage hero content overlaps hero media at "
                            f"{desktop_width}px (viewport {hero_layout['viewportWidth']}px)"
                        ),
                    )

            driver.set_window_size(1366, 900)
            wide_hero = driver.execute_script(
                """
                const h1 = document.querySelector('.hero-content h1');
                const media = document.querySelector('.hero-media');
                const cta = document.querySelector('#cta-call-hero');
                const h1Rect = h1.getBoundingClientRect();
                const mediaRect = media.getBoundingClientRect();
                const ctaRect = cta.getBoundingClientRect();
                const mediaStyle = getComputedStyle(media);
                const viewportWidth = document.documentElement.clientWidth;
                const viewportHeight = document.documentElement.clientHeight;
                const overlapWidth = Math.max(
                  0,
                  Math.min(h1Rect.right, mediaRect.right) -
                    Math.max(h1Rect.left, mediaRect.left),
                );
                const overlapHeight = Math.max(
                  0,
                  Math.min(h1Rect.bottom, mediaRect.bottom) -
                    Math.max(h1Rect.top, mediaRect.top),
                );
                return {
                  viewportWidth,
                  viewportHeight,
                  h1FontSize: parseFloat(getComputedStyle(h1).fontSize),
                  mediaVisible:
                    mediaStyle.display !== 'none' &&
                    mediaStyle.visibility !== 'hidden' &&
                    mediaRect.width > 0 &&
                    mediaRect.height > 0,
                  overlapWidth,
                  overlapHeight,
                  ctaWithinViewport:
                    ctaRect.left >= -0.5 &&
                    ctaRect.top >= -0.5 &&
                    ctaRect.right <= viewportWidth + 0.5 &&
                    ctaRect.bottom <= viewportHeight + 0.5,
                  overflow:
                    document.documentElement.scrollWidth -
                    document.documentElement.clientWidth,
                };
                """
            )
            check(wide_hero["overflow"] <= 1, "homepage has horizontal overflow at 1366px")
            check(
                wide_hero["ctaWithinViewport"],
                (
                    "homepage hero CTA is outside the 1366x900 viewport "
                    f"(actual viewport {wide_hero['viewportWidth']}x{wide_hero['viewportHeight']})"
                ),
            )
            check(wide_hero["h1FontSize"] <= 72.5, "homepage hero H1 exceeds its 72px cap")
            if wide_hero["mediaVisible"]:
                check(
                    not (
                        wide_hero["overlapWidth"] > 0.5
                        and wide_hero["overlapHeight"] > 0.5
                    ),
                    "homepage hero H1 overlaps hero media at 1366x900",
                )

            driver.set_window_size(1200, 900)
            check(driver.execute_script("return getComputedStyle(document.querySelector('.mobile-contact-bar')).display") == "none", "mobile sticky CTA remains visible on desktop")
            check(len(driver.find_elements(By.CSS_SELECTOR, ".floating-call")) == 0, "legacy floating CTA remains in the DOM")

            for page in CORE_PAGES:
                driver.get(local_url(page))
                wait.until(lambda current: current.execute_script("return document.readyState") in {"interactive", "complete"})
                wait.until(lambda current: len(current.find_elements(By.CSS_SELECTOR, ".mobile-call-sticky")) == 1)
                check(len(driver.find_elements(By.TAG_NAME, "h1")) == 1, f"{page}: expected one H1")
                check(len(driver.find_elements(By.CSS_SELECTOR, '.mobile-call-sticky')) == 1, f"{page}: duplicate/missing sticky CTA")
                check(len(driver.find_elements(By.CSS_SELECTOR, '.floating-call')) == 0, f"{page}: legacy floating CTA exists")
                for entry in driver.get_log("browser"):
                    message = entry.get("message", "")
                    if entry.get("level") == "SEVERE" and any(
                        token in message for token in ["Uncaught", "TypeError", "ReferenceError", "SyntaxError"]
                    ):
                        raise AssertionError(f"{page}: browser console error: {message}")

            driver.get(local_url("baltimore-glass-door-locksmith.html"))
            wait.until(lambda current: len(current.find_elements(By.CSS_SELECTOR, ".mobile-call-sticky")) == 1)
            baltimore_context = driver.execute_script(
                """
                const sticky = document.querySelector('.mobile-call-sticky');
                return {
                  bodyService: document.body.dataset.service,
                  bodyLocation: document.body.dataset.location,
                  stickyService: sticky.dataset.service,
                  stickyLocation: sticky.dataset.location,
                };
                """
            )
            check(
                baltimore_context["bodyService"] == "emergency-glass-repair"
                and baltimore_context["stickyService"] == "emergency-glass-repair",
                "Baltimore body/sticky service context is incorrect",
            )
            check(
                baltimore_context["bodyLocation"] == "baltimore-md"
                and baltimore_context["stickyLocation"] == "baltimore-md",
                "Baltimore body/sticky location context is incorrect",
            )

            for page in CORE_PAGES + CITY_PAGES:
                driver.get(local_url(page))
                wait.until(lambda current: current.execute_script("return Boolean(window.CapitalGlassDoor)"))
                contacts = driver.execute_script(
                    """
                    return {
                      calls: [...document.querySelectorAll('a[href^="tel:"]')].map(a => a.getAttribute('href')),
                      messages: [...document.querySelectorAll('.whatsapp-cta')].map(a => a.getAttribute('href')),
                      prohibited: document.querySelectorAll('form, input, textarea, a[href^="mailto:"], a[href^="sms:"]').length,
                    };
                    """
                )
                check(contacts["calls"] and all(href == "tel:+12026434062" for href in contacts["calls"]), f"{page}: wrong direct-call destination")
                check(contacts["messages"] and all(href == "https://wa.me/17032440559" for href in contacts["messages"]), f"{page}: WhatsApp destination changed")
                check(contacts["prohibited"] == 0, f"{page}: prohibited contact action")
                if page in CITY_PAGES:
                    check(len(driver.find_elements(By.CSS_SELECTOR, '.neighborhood-coverage article')) == 3, f"{page}: neighborhood guidance missing")
                messaging = driver.execute_script(
                    """
                    window.__contactEvents = [];
                    window.gtag = (...args) => window.__contactEvents.push(args);
                    const link = document.querySelector('.whatsapp-cta');
                    const event = new Event('click', {bubbles: true, cancelable: true});
                    link.dispatchEvent(event);
                    return {calls: window.__contactEvents, prevented: event.defaultPrevented};
                    """
                )
                check(not messaging["prevented"] and len(messaging["calls"]) == 1, f"{page}: WhatsApp event blocked or duplicated")
                check(messaging["calls"][0][:2] == ["event", "whatsapp_click"], f"{page}: WhatsApp tracked as a call")
                check(messaging["calls"][0][2]["visible_number"] == "703-244-0559", f"{page}: WhatsApp analytics number changed")
                for width in (320, 360, 390, 600, 768, 769, 1366):
                    driver.set_window_size(width, 844)
                    layout = driver.execute_script(
                        """
                        const bar = document.querySelector('.mobile-contact-bar');
                        const buttons = [...bar.querySelectorAll('a')].map(a => {
                          const r = a.getBoundingClientRect();
                          return {left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height};
                        });
                        return {
                          mobile: matchMedia('(max-width: 768px)').matches,
                          shown: getComputedStyle(bar).display !== 'none',
                          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
                          viewport: innerWidth, height: innerHeight, buttons,
                          navFits: (() => {
                            const logo = document.querySelector('nav > .nav-logo').getBoundingClientRect();
                            const toggle = document.querySelector('[data-nav-toggle]').getBoundingClientRect();
                            return logo.right <= toggle.left && toggle.right <= innerWidth;
                          })(),
                        };
                        """
                    )
                    check(layout["overflow"] <= 1, f"{page}: overflow at {width}px")
                    check(layout["shown"] == layout["mobile"], f"{page}: wrong contact bar breakpoint at {width}px")
                    if layout["mobile"]:
                        check(layout["navFits"], f"{page}: mobile logo and menu overlap at {width}px")
                        for button in layout["buttons"]:
                            check(button["width"] >= 44 and button["height"] >= 44, f"{page}: contact target too small at {width}px")
                            check(button["left"] >= 0 and button["right"] <= layout["viewport"] and button["bottom"] <= layout["height"], f"{page}: contact button clipped at {width}px")
                        check(layout["buttons"][0]["right"] <= layout["buttons"][1]["left"], f"{page}: contacts overlap at {width}px")
                driver.set_window_size(390, 844)
                driver.execute_script("document.documentElement.style.scrollBehavior = 'auto'")
                # content-visibility sections can change document height as they enter view.
                wait.until(lambda current: current.execute_script("window.scrollTo(0, document.documentElement.scrollHeight); return document.querySelector('footer').getBoundingClientRect().bottom <= document.querySelector('.mobile-contact-bar').getBoundingClientRect().top + 1"), f"{page}: contact bar covers the footer")
                if page == "index.html":
                    driver.execute_script("window.scrollTo(0, 0)")
                    screenshot_dir = os.environ.get("CGD_SCREENSHOT_DIR")
                    if screenshot_dir:
                        Path(screenshot_dir).mkdir(parents=True, exist_ok=True)
                        driver.save_screenshot(str(Path(screenshot_dir) / "home-mobile.png"))

            # Contact choices must survive disabled or blocked application JavaScript.
            driver.execute_cdp_cmd("Emulation.setScriptExecutionDisabled", {"value": True})
            driver.get(local_url("index.html"))
            check(driver.find_element(By.CSS_SELECTOR, '.mobile-call-sticky').is_displayed(), "call action requires JavaScript")
            check(driver.find_element(By.CSS_SELECTOR, '.mobile-whatsapp-sticky').is_displayed(), "WhatsApp action requires JavaScript")
            driver.execute_cdp_cmd("Emulation.setScriptExecutionDisabled", {"value": False})
            print(f"Browser smoke tests passed: {len(CORE_PAGES)} core + {len(CITY_PAGES)} city pages, 7 viewport widths, both contact destinations, analytics, and no-JS contacts.")
        finally:
            driver.quit()


if __name__ == "__main__":
    # HTTP gives assets, session storage, and referrers the same origin as deployment.
    # Generic click Events above exercise analytics without launching an OS dialer.
    class QuietHandler(SimpleHTTPRequestHandler):
        def log_message(self, *_args):
            pass

    with ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=str(ROOT))) as server:
        BASE_URL = f"http://127.0.0.1:{server.server_port}"
        thread = Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            main()
        finally:
            server.shutdown()
