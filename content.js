/* Maps Lead Scraper — content script
 * Runs on Google Maps. Auto-scrolls the results feed to load every listing,
 * then extracts business data (name, rating, reviews, category, address,
 * phone, website) from each card.
 *
 * Google Maps class names are obfuscated and change over time, so we lean on
 * structural + aria-label + text-regex heuristics with several fallbacks.
 */

(() => {
  "use strict";

  // Avoid double-injecting the message listener on repeated runs.
  if (window.__mapsLeadScraperLoaded) return;
  window.__mapsLeadScraperLoaded = true;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const PHONE_RE =
    /(\+?\d[\d\s().-]{7,}\d)/g; // loose international phone matcher

  function getFeed() {
    return (
      document.querySelector('div[role="feed"]') ||
      document.querySelector('div[aria-label][role="region"]') ||
      null
    );
  }

  function getCards(feed) {
    // Each result card most reliably contains the place link .hfpxzc
    const links = Array.from(
      (feed || document).querySelectorAll("a.hfpxzc, a[href*='/maps/place/']")
    );
    const cards = [];
    const seen = new Set();
    for (const link of links) {
      // Walk up to the card container that holds all the meta info.
      let card = link.closest(".Nv2PK") || link.parentElement;
      if (!card) continue;
      if (seen.has(card)) continue;
      seen.add(card);
      cards.push({ card, link });
    }
    return cards;
  }

  async function autoScroll(feed, onProgress) {
    if (!feed) return;
    let lastCount = -1;
    let stagnant = 0;
    const maxStagnant = 6; // stop after feed stops growing
    const maxLoops = 120; // hard safety cap
    for (let i = 0; i < maxLoops; i++) {
      feed.scrollTo(0, feed.scrollHeight);
      await sleep(900);

      const count = getCards(feed).length;
      if (onProgress) onProgress(count);

      // Detect "end of list" marker Google appends.
      const reachedEnd = /you've reached the end|no more results/i.test(
        feed.textContent || ""
      );

      if (count === lastCount) {
        stagnant++;
      } else {
        stagnant = 0;
        lastCount = count;
      }
      if (reachedEnd || stagnant >= maxStagnant) break;
    }
  }

  function textOf(el) {
    return (el ? el.textContent || "" : "").trim();
  }

  function extractRating(card) {
    // Rating span, e.g. "4.6"
    const el =
      card.querySelector("span.MW4etd") ||
      card.querySelector('span[aria-hidden="true"][class*="fontBodyMedium"]');
    const t = textOf(el).replace(",", ".");
    const m = t.match(/^\d(?:\.\d)?$/);
    if (m) return parseFloat(m[0]);
    // Fallback: aria-label like "4.6 stars 120 Reviews"
    const aria = card.querySelector('[role="img"][aria-label*="star" i]');
    if (aria) {
      const am = (aria.getAttribute("aria-label") || "").match(/([\d.]+)\s*star/i);
      if (am) return parseFloat(am[1]);
    }
    return null;
  }

  function extractReviews(card) {
    // Reviews count often in span.UY7F9 like "(1,234)"
    const el = card.querySelector("span.UY7F9");
    if (el) {
      const n = textOf(el).replace(/[^\d]/g, "");
      if (n) return parseInt(n, 10);
    }
    // Fallback from the star aria-label "4.6 stars 120 Reviews"
    const aria = card.querySelector('[role="img"][aria-label*="star" i]');
    if (aria) {
      const am = (aria.getAttribute("aria-label") || "").match(
        /([\d,]+)\s*review/i
      );
      if (am) return parseInt(am[1].replace(/,/g, ""), 10);
    }
    return null;
  }

  function extractWebsite(card) {
    const a =
      card.querySelector('a[data-value="Website"]') ||
      card.querySelector('a[aria-label^="Visit" i][href^="http"]') ||
      card.querySelector('a.lcr4fd[href^="http"]');
    if (a && a.href && !/google\.[a-z.]+\/maps/.test(a.href)) return a.href;
    return "";
  }

  function extractPhone(card) {
    // Google renders phone inside a span with a special class, but the most
    // reliable path is a regex over the card's visible text.
    const explicit = card.querySelector("span.UsdlK");
    if (explicit) {
      const t = textOf(explicit);
      if (t) return t;
    }
    const text = card.innerText || card.textContent || "";
    const matches = text.match(PHONE_RE);
    if (matches) {
      // Pick the candidate that looks most phone-like (7-15 digits).
      for (const cand of matches) {
        const digits = cand.replace(/\D/g, "");
        if (digits.length >= 7 && digits.length <= 15) return cand.trim();
      }
    }
    return "";
  }

  function extractOpenStatus(card) {
    // Google shows hours as e.g. "Open ⋅ Closes 11 PM", "Closed ⋅ Opens 9 AM",
    // "Open 24 hours", "Temporarily closed". The leading word is the state.
    // The open/closed word lives in a colored span inside a .W4Efsd row.
    const rows = Array.from(card.querySelectorAll("div.W4Efsd, span.W4Efsd"));
    let status = "";
    for (const row of rows) {
      const t = textOf(row).replace(/\s+/g, " ");
      if (/\b(open|closed|opens|closes|24 hours)\b/i.test(t)) {
        // Trim to just the hours segment if the row also holds category/address.
        const m = t.match(
          /(Open 24 hours|Temporarily closed|Permanently closed|Open|Closed|Opens[^·⋅|]*|Closes[^·⋅|]*)(?:\s*[·⋅|]\s*(Opens|Closes)[^·⋅|]*)?/i
        );
        status = (m ? m[0] : t).trim();
        break;
      }
    }
    if (!status) return { status: "", openNow: null };

    let openNow = null;
    if (/^open 24 hours/i.test(status)) openNow = true;
    else if (/temporarily closed|permanently closed/i.test(status)) openNow = false;
    else if (/^opens\b/i.test(status)) openNow = false; // "Opens 9 AM" => closed now
    else if (/^closes soon/i.test(status)) openNow = true; // closing but still open
    else if (/^open\b/i.test(status)) openNow = true;
    else if (/^closed\b/i.test(status)) openNow = false;

    return { status, openNow };
  }

  function isSponsored(card) {
    // Maps marks paid results with a small "Sponsored" / "Ad" label.
    const els = card.querySelectorAll("span, div");
    for (const el of els) {
      const t = (el.textContent || "").trim();
      if (t === "Sponsored" || t === "Ad" || /^Ad\s*·/.test(t)) return true;
    }
    return false;
  }

  function extractCategoryAddress(card) {
    // The .W4Efsd rows hold category · rating and category · address · phone
    const rows = Array.from(card.querySelectorAll("div.W4Efsd"));
    let category = "";
    let address = "";
    for (const row of rows) {
      const spans = Array.from(row.querySelectorAll("span")).filter(
        (s) => textOf(s) && textOf(s) !== "·"
      );
      const parts = spans.map(textOf);
      for (const p of parts) {
        if (!p || p === "·") continue;
        // Address usually contains digits or a street-ish word.
        if (!category && /^[A-Za-z][A-Za-z &/'-]+$/.test(p) && p.length < 40) {
          category = p;
        } else if (!address && /\d|st\b|road|rd\b|ave|block|phase/i.test(p)) {
          address = p;
        }
      }
    }
    return { category, address };
  }

  function scrapeAll() {
    const feed = getFeed();
    const cards = getCards(feed);
    const results = [];
    const seenNames = new Set();

    for (const { card, link } of cards) {
      const name =
        textOf(card.querySelector("div.qBF1Pd")) ||
        (link.getAttribute("aria-label") || "").trim() ||
        textOf(card.querySelector('[class*="fontHeadline"]'));
      if (!name) continue;

      const rating = extractRating(card);
      const reviews = extractReviews(card);
      const website = extractWebsite(card);
      const phone = extractPhone(card);
      const { category, address } = extractCategoryAddress(card);
      const { status, openNow } = extractOpenStatus(card);
      const sponsored = isSponsored(card);
      const mapsUrl = link.href || "";

      const key = name + "|" + mapsUrl;
      if (seenNames.has(key)) continue;
      seenNames.add(key);

      results.push({
        name,
        phone,
        website,
        rating,
        reviews: reviews == null ? "" : reviews,
        category,
        address,
        status,
        openNow,
        sponsored,
        mapsUrl,
      });
    }
    return results;
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "SCRAPE") {
      (async () => {
        try {
          const feed = getFeed();
          if (!feed) {
            sendResponse({
              ok: false,
              error:
                "No results feed found. Run a Google Maps search (e.g. 'gyms in Karachi') first, then try again.",
            });
            return;
          }
          if (msg.autoScroll !== false) {
            await autoScroll(feed);
          }
          const data = scrapeAll();
          sendResponse({ ok: true, data });
        } catch (e) {
          sendResponse({ ok: false, error: String((e && e.message) || e) });
        }
      })();
      return true; // keep the message channel open for the async response
    }

    if (msg && msg.type === "PING") {
      sendResponse({ ok: true });
      return true;
    }
  });
})();
