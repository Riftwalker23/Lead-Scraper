/* Maps Lead Scraper — popup logic */

const $ = (id) => document.getElementById(id);

const COLUMNS = [
  ["name", "Name"],
  ["phone", "Phone"],
  ["website", "Website"],
  ["rating", "Rating"],
  ["reviews", "Reviews"],
  ["category", "Category"],
  ["address", "Address"],
  ["status", "Open Status"],
  ["mapsUrl", "Google Maps URL"],
];

let allLeads = []; // last scrape, unfiltered

// Sample data for the "Try demo" button — mimics a real Maps scrape.
const SAMPLE = [
  { name: "Iron Paradise Gym", phone: "+92 21 3456 7890", website: "https://ironparadise.pk", rating: 4.7, reviews: 1284, category: "Gym", address: "Clifton Block 5, Karachi", status: "Open ⋅ Closes 11 PM", openNow: true, sponsored: false, mapsUrl: "https://maps.google.com/?cid=1" },
  { name: "FitZone Fitness Club", phone: "+92 300 1234567", website: "", rating: 4.3, reviews: 342, category: "Fitness center", address: "DHA Phase 6, Karachi", status: "Open ⋅ Closes 10 PM", openNow: true, sponsored: false, mapsUrl: "https://maps.google.com/?cid=2" },
  { name: "PowerHouse Gym Gulshan", phone: "+92 21 3499 1122", website: "https://powerhouse.com.pk", rating: 4.9, reviews: 87, category: "Gym", address: "Gulshan-e-Iqbal, Karachi", status: "Closed ⋅ Opens 6 AM", openNow: false, sponsored: true, mapsUrl: "https://maps.google.com/?cid=3" },
  { name: "Flex Fitness Studio", phone: "", website: "", rating: 3.4, reviews: 21, category: "Gym", address: "North Nazimabad, Karachi", status: "Open 24 hours", openNow: true, sponsored: false, mapsUrl: "https://maps.google.com/?cid=4" },
  { name: "Titan Strength Gym", phone: "+92 333 9876543", website: "https://titanstrength.pk", rating: 4.1, reviews: 512, category: "Gym", address: "Bahadurabad, Karachi", status: "Open ⋅ Closes 12 AM", openNow: true, sponsored: false, mapsUrl: "https://maps.google.com/?cid=5" },
  { name: "Elite CrossFit Karachi", phone: "+92 21 3520 4400", website: "", rating: 4.6, reviews: 156, category: "CrossFit box", address: "Tariq Road, Karachi", status: "Closed ⋅ Opens 7 AM", openNow: false, sponsored: false, mapsUrl: "https://maps.google.com/?cid=6" },
  { name: "Body Sculpt Ladies Gym", phone: "+92 345 5551234", website: "https://bodysculpt.pk", rating: 4.8, reviews: 43, category: "Women's gym", address: "PECHS Block 2, Karachi", status: "Open ⋅ Closes 9 PM", openNow: true, sponsored: false, mapsUrl: "https://maps.google.com/?cid=7" },
  { name: "MuscleWorks Fitness", phone: "", website: "", rating: 2.9, reviews: 8, category: "Gym", address: "Malir Cantt, Karachi", status: "", openNow: null, sponsored: false, mapsUrl: "https://maps.google.com/?cid=8" },
];

// ---- Filters --------------------------------------------------------------

function readFilters() {
  return {
    phone: $("f-phone").checked,
    website: $("f-website").checked,
    noWebsite: $("f-nowebsite").checked,
    reviews: $("f-reviews").checked,
    reviewsMin: parseInt($("f-reviews-min").value, 10) || 0,
    rating: $("f-rating").checked,
    ratingMin: parseFloat($("f-rating-min").value) || 0,
    openNow: $("f-open").checked,
    maxReviews: $("f-maxreviews").checked,
    maxReviewsVal: parseInt($("f-maxreviews-val").value, 10) || 0,
    maxRating: $("f-maxrating").checked,
    maxRatingVal: parseFloat($("f-maxrating-val").value) || 0,
    category: $("f-cat").checked,
    categoryText: $("f-cat-val").value.trim().toLowerCase(),
    noSponsored: $("f-nosponsored").checked,
  };
}

function applyFilters(leads, f) {
  return leads.filter((l) => {
    if (f.phone && !l.phone) return false;
    if (f.website && !l.website) return false;
    if (f.noWebsite && l.website) return false;
    if (f.reviews && (l.reviews === "" || Number(l.reviews) < f.reviewsMin))
      return false;
    if (f.rating && (l.rating == null || Number(l.rating) < f.ratingMin))
      return false;
    if (f.openNow && l.openNow !== true) return false;
    if (f.maxReviews && (l.reviews === "" || Number(l.reviews) > f.maxReviewsVal))
      return false;
    if (f.maxRating && (l.rating == null || Number(l.rating) > f.maxRatingVal))
      return false;
    if (
      f.category &&
      f.categoryText &&
      !(l.category || "").toLowerCase().includes(f.categoryText)
    )
      return false;
    if (f.noSponsored && l.sponsored) return false;
    return true;
  });
}

function getFilteredLeads() {
  return applyFilters(allLeads, readFilters());
}

// ---- Formatting -----------------------------------------------------------

function toTSV(leads) {
  const header = COLUMNS.map((c) => c[1]).join("\t");
  const rows = leads.map((l) =>
    COLUMNS.map((c) => String(l[c[0]] ?? "").replace(/[\t\n\r]+/g, " ")).join("\t")
  );
  return [header, ...rows].join("\n");
}

function toCSV(leads) {
  const esc = (v) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const header = COLUMNS.map((c) => esc(c[1])).join(",");
  const rows = leads.map((l) => COLUMNS.map((c) => esc(l[c[0]])).join(","));
  return [header, ...rows].join("\n");
}

// ---- UI helpers -----------------------------------------------------------

function setDot(state) {
  // state: "on" | "busy" | "err" | "" (idle)
  $("dot").className = "dot" + (state ? " " + state : "");
}

function setStatus(msg, kind) {
  const el = $("status");
  el.className = "status" + (kind ? " " + kind : "");
  el.textContent = msg;
  el.classList.remove("hidden");
  setDot(kind === "error" ? "err" : kind === "working" ? "busy" : "on");
}

function clearStatus() {
  $("status").classList.add("hidden");
}

function esc(s) {
  const d = document.createElement("div");
  d.textContent = String(s ?? "");
  return d.innerHTML;
}

function renderPreview(leads) {
  const box = $("preview");
  if (!leads.length) {
    box.innerHTML = `<div class="preview-empty">No leads match the current filters.</div>`;
    return;
  }
  box.innerHTML = leads
    .map((l) => {
      const rating =
        l.rating != null
          ? `<span class="lead-rating">★ ${l.rating}${
              l.reviews !== "" ? ` (${l.reviews})` : ""
            }</span>`
          : "";
      const meta = [l.category, l.address].filter(Boolean).join(" · ");
      const badges = [];
      badges.push(
        l.phone
          ? `<span class="badge ok">📞 Phone</span>`
          : `<span class="badge no">No phone</span>`
      );
      badges.push(
        l.website
          ? `<span class="badge ok">🌐 Website</span>`
          : `<span class="badge no">No website</span>`
      );
      if (l.openNow === true) badges.push(`<span class="badge open">🟢 Open</span>`);
      else if (l.openNow === false)
        badges.push(`<span class="badge closed">🔴 Closed</span>`);
      if (l.sponsored) badges.push(`<span class="badge ad">Ad</span>`);

      return `<div class="lead">
        <div class="lead-top">
          <span class="lead-name">${esc(l.name)}</span>
          ${rating}
        </div>
        ${meta ? `<div class="lead-meta">${esc(meta)}</div>` : ""}
        <div class="badges">${badges.join("")}</div>
      </div>`;
    })
    .join("");
}

function refreshPills() {
  const filtered = getFilteredLeads();
  $("count-pill").textContent = allLeads.length;
  $("filtered-pill").textContent = filtered.length;
  renderPreview(filtered);
}

async function copyLeads(leads) {
  const tsv = toTSV(leads);
  // execCommand on a focused textarea is the most reliable path inside an
  // extension popup (works even when navigator.clipboard is blocked).
  try {
    const ta = document.createElement("textarea");
    ta.value = tsv;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    if (ok) return true;
  } catch {
    /* fall through */
  }
  try {
    await navigator.clipboard.writeText(tsv);
    return true;
  } catch {
    return false;
  }
}

// Injected into the freshly-opened Google Sheet/Doc to remind the user to paste.
function pasteBanner(count, where) {
  if (document.getElementById("__lead_paste_banner")) return;
  const isMac = navigator.platform.toLowerCase().includes("mac");
  const combo = isMac ? "⌘ + V" : "Ctrl + V";
  const target = where === "doc" ? "Click in the document" : "Click cell <b>A1</b>";
  const b = document.createElement("div");
  b.id = "__lead_paste_banner";
  b.innerHTML =
    '<div style="font-size:22px;line-height:1">📋</div>' +
    '<div><div style="font-weight:700;font-size:14px;margin-bottom:2px">' +
    count +
    " leads copied to your clipboard</div>" +
    '<div style="font-size:12.5px;opacity:.92">' +
    target +
    " and press <b>" +
    combo +
    "</b> to paste them in.</div></div>" +
    '<div id="__lpb_close" style="margin-left:8px;cursor:pointer;font-size:18px;opacity:.8;padding:2px 6px">×</div>';
  Object.assign(b.style, {
    position: "fixed",
    top: "16px",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: "2147483647",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "linear-gradient(145deg,#2563eb,#1d4ed8)",
    color: "#fff",
    padding: "12px 16px",
    borderRadius: "12px",
    boxShadow: "0 8px 28px rgba(0,0,0,.35)",
    fontFamily: "Segoe UI, Roboto, Arial, sans-serif",
    maxWidth: "90vw",
  });
  document.body.appendChild(b);
  const close = () => b.remove();
  document.getElementById("__lpb_close").addEventListener("click", close);
  // Dismiss automatically once the user actually pastes, or after 20s.
  document.addEventListener("paste", () => setTimeout(close, 400), { once: true });
  setTimeout(close, 20000);
}

function showBannerWhenReady(tabId, count, where) {
  const listener = (id, info) => {
    if (id === tabId && info.status === "complete") {
      chrome.tabs.onUpdated.removeListener(listener);
      chrome.scripting
        .executeScript({
          target: { tabId },
          func: pasteBanner,
          args: [count, where || "sheet"],
        })
        .catch(() => {});
    }
  };
  chrome.tabs.onUpdated.addListener(listener);
}

// ---- Enrichment (phone + website from each place's detail page) -----------

// Injected into a place tab; polls for the detail panel's stable data-item-id
// elements and returns phone / website / address / category.
function scrapePlaceInTab() {
  return new Promise((resolve) => {
    const start = Date.now();
    const clean = (s) => (s || "").replace(/^[^:]*:\s*/, "").trim();
    const tick = () => {
      const p = document.querySelector('button[data-item-id^="phone:tel:"]');
      const w = document.querySelector('a[data-item-id="authority"]');
      const a = document.querySelector('button[data-item-id="address"]');
      const cat = document.querySelector('button[jsaction*="category"]');
      if (a || p || w || Date.now() - start > 10000) {
        resolve({
          phone: p ? clean(p.getAttribute("aria-label")) : "",
          website: w ? w.href : "",
          address: a ? clean(a.getAttribute("aria-label")) : "",
          category: cat ? cat.textContent.trim() : "",
        });
        return;
      }
      setTimeout(tick, 300);
    };
    tick();
  });
}

function waitForTabComplete(tabId, timeout) {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      chrome.tabs.onUpdated.removeListener(listener);
      resolve();
    };
    const listener = (id, info) => {
      if (id === tabId && info.status === "complete") finish();
    };
    chrome.tabs.onUpdated.addListener(listener);
    setTimeout(finish, timeout);
  });
}

async function enrichLeads(leads, onProgress) {
  const queue = leads.filter(
    (l) => /\/maps\/place\//.test(l.mapsUrl || "") && (!l.phone || !l.website)
  );
  const total = queue.length;
  if (!total) return { total: 0, filled: 0, failed: 0 };
  let done = 0;
  let filled = 0;
  let failed = 0;
  const concurrency = Math.min(3, total);

  async function scrapeOnce(tabId) {
    const res = await chrome.scripting.executeScript({
      target: { tabId },
      func: scrapePlaceInTab,
    });
    return res && res[0] && res[0].result;
  }

  async function worker() {
    while (queue.length) {
      const lead = queue.shift();
      let got = false;
      try {
        const tab = await chrome.tabs.create({ url: lead.mapsUrl, active: false });
        await waitForTabComplete(tab.id, 20000);
        let data = await scrapeOnce(tab.id);
        // Retry once if the panel wasn't ready yet.
        if (!data || (!data.phone && !data.website && !data.address)) {
          await new Promise((r) => setTimeout(r, 1800));
          data = await scrapeOnce(tab.id);
        }
        if (data) {
          if (data.phone) lead.phone = data.phone;
          if (data.website) lead.website = data.website;
          if (data.address) lead.address = data.address;
          if (data.category && !lead.category) lead.category = data.category;
          got = !!(data.phone || data.website);
        }
        await chrome.tabs.remove(tab.id).catch(() => {});
      } catch (e) {
        /* skip this lead */
      }
      got ? filled++ : failed++;
      done++;
      if (onProgress) onProgress(done, total);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
  return { total, filled, failed };
}

// Copy leads as a rich HTML table (pastes as a real table in Docs/Sheets).
function copyRichLeads(leads) {
  const cell = (v) => `<td style="border:1px solid #ccc;padding:4px 8px">${esc(
    v === null || v === undefined ? "" : v
  )}</td>`;
  const head = COLUMNS.map(
    (c) =>
      `<th style="border:1px solid #ccc;padding:4px 8px;background:#eef;text-align:left">${c[1]}</th>`
  ).join("");
  const rows = leads
    .map((l) => `<tr>${COLUMNS.map((c) => cell(l[c[0]])).join("")}</tr>`)
    .join("");
  const table = document.createElement("table");
  table.setAttribute("border", "1");
  table.style.borderCollapse = "collapse";
  table.innerHTML = `<thead><tr>${head}</tr></thead><tbody>${rows}</tbody>`;
  table.style.position = "fixed";
  table.style.left = "-9999px";
  document.body.appendChild(table);

  const range = document.createRange();
  range.selectNode(table);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  sel.removeAllRanges();
  table.remove();
  return ok;
}

// ---- Scrape flow ----------------------------------------------------------

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function isMapsUrl(url) {
  return /^https:\/\/www\.google\.[a-z.]+\/maps\//.test(url || "");
}

async function ensureContentScript(tabId) {
  // Try a ping; if no listener, inject the script programmatically.
  try {
    await chrome.tabs.sendMessage(tabId, { type: "PING" });
    return true;
  } catch {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ["content.js"],
      });
      return true;
    } catch (e) {
      return false;
    }
  }
}

// Disable the Scrape button and show a spinner while scraping/fetching.
function setBusy(on, label) {
  const btn = $("scrape");
  btn.disabled = on;
  btn.classList.toggle("loading", on);
  const lbl = btn.querySelector(".btn-label");
  if (lbl) lbl.textContent = on ? label || "Working…" : "Scrape leads";
}

async function doScrape() {
  const tab = await getActiveTab();

  if (!isMapsUrl(tab.url)) {
    setStatus(
      "Open Google Maps and run a search first (e.g. 'gyms in Karachi'), then click Scrape.",
      "error"
    );
    return;
  }

  setBusy(true, "Scraping…");
  $("result").classList.add("hidden");
  setStatus("Loading & scrolling results… this can take a moment.", "working");

  const ready = await ensureContentScript(tab.id);
  if (!ready) {
    setStatus("Couldn't start the scraper on this tab. Reload the page and retry.", "error");
    setBusy(false);
    return;
  }

  const autoScroll = $("opt-autoscroll").checked;

  chrome.tabs.sendMessage(tab.id, { type: "SCRAPE", autoScroll }, (resp) => {
    if (chrome.runtime.lastError) {
      setBusy(false);
      setStatus(
        "Scraper didn't respond. Reload the Maps tab and try again.",
        "error"
      );
      return;
    }
    if (!resp || !resp.ok) {
      setBusy(false);
      setStatus((resp && resp.error) || "Scrape failed.", "error");
      return;
    }

    allLeads = resp.data || [];
    if (allLeads.length === 0) {
      setBusy(false);
      setStatus("No leads found on this page.", "error");
      return;
    }

    clearStatus();
    refreshPills();
    $("result").classList.remove("hidden");
    chrome.storage.local.set({ lastLeads: allLeads });

    // Phone & website aren't in Maps' list. Fetch them for ALL scraped leads
    // (must happen before filtering by phone/website). Only 3 tabs open at a
    // time, so even big lists are safe — they just take a few minutes.
    const needEnrich = allLeads.filter(
      (l) => /\/maps\/place\//.test(l.mapsUrl || "") && (!l.phone || !l.website)
    ).length;
    if (needEnrich && $("opt-enrich").checked) {
      runEnrich(allLeads); // manages the busy state itself
    } else {
      setBusy(false);
      if (needEnrich) {
        setStatus(
          `Scraped ${allLeads.length}. Turn on "Auto-fetch phone & website" and scrape again to fill those columns.`
        );
      }
    }
  });
}

// ---- Buttons --------------------------------------------------------------

$("scrape").addEventListener("click", doScrape);

$("copy").addEventListener("click", async () => {
  const leads = getFilteredLeads();
  if (!leads.length) return setStatus("No leads match the filters.", "error");
  const ok = await copyLeads(leads);
  setStatus(
    ok
      ? `Copied ${leads.length} leads. Paste into any sheet with Ctrl+V.`
      : "Copy failed — try Download CSV instead.",
    ok ? "" : "error"
  );
});

async function runEnrich(leads) {
  const todo = leads.filter(
    (l) => /\/maps\/place\//.test(l.mapsUrl || "") && (!l.phone || !l.website)
  );
  if (!todo.length) {
    setBusy(false);
    return;
  }
  setBusy(true, "Fetching phone & website…");
  setStatus(
    `Fetching phone & website for ${todo.length} leads… opening each listing briefly. Keep this popup open.`,
    "working"
  );
  const { filled, failed } = await enrichLeads(leads, (done, total) => {
    setStatus(
      `Fetching phone & website… ${done}/${total} listings checked. Keep this popup open.`,
      "working"
    );
    // Update the preview live and persist partial progress every few leads.
    refreshPills();
    if (done % 5 === 0) chrome.storage.local.set({ lastLeads: allLeads });
  });
  setBusy(false);
  refreshPills();
  chrome.storage.local.set({ lastLeads: allLeads });
  const noneListed = failed > 0 ? ` ${failed} had none listed on Google.` : "";
  setStatus(
    filled > 0
      ? `✅ Filled phone/website for ${filled} lead${filled === 1 ? "" : "s"}.${noneListed}`
      : "Finished, but none of those listings show a phone or website on Google.",
    filled > 0 ? "" : "error"
  );
}

$("docs").addEventListener("click", async () => {
  const leads = getFilteredLeads();
  if (!leads.length) return setStatus("No leads match the filters.", "error");
  // Rich copy so it pastes as a formatted table in the Doc.
  const ok = copyRichLeads(leads) || (await copyLeads(leads));
  if (!ok) {
    setStatus("Copy failed — try Download CSV instead.", "error");
    return;
  }
  const tab = await chrome.tabs.create({ url: "https://docs.new" });
  showBannerWhenReady(tab.id, leads.length, "doc");
});

$("pdf").addEventListener("click", async () => {
  const leads = getFilteredLeads();
  if (!leads.length) return setStatus("No leads match the filters.", "error");
  // Hand the leads to the print page via storage, then open it; it renders a
  // table and opens the print dialog (choose "Save as PDF").
  await chrome.storage.local.set({ printLeads: { leads } });
  await chrome.tabs.create({ url: chrome.runtime.getURL("print.html") });
});

$("csv").addEventListener("click", () => {
  const leads = getFilteredLeads();
  if (!leads.length) return setStatus("No leads match the filters.", "error");
  const blob = new Blob([toCSV(leads)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().slice(0, 10);
  chrome.downloads?.download
    ? chrome.downloads.download({ url, filename: `leads-${stamp}.csv` })
    : (() => {
        const a = document.createElement("a");
        a.href = url;
        a.download = `leads-${stamp}.csv`;
        a.click();
      })();
});

$("demo").addEventListener("click", () => {
  allLeads = SAMPLE.slice();
  clearStatus();
  refreshPills();
  $("result").classList.remove("hidden");
  setStatus(`Demo data loaded — ${allLeads.length} sample leads. Toggle filters to see them update.`);
});

$("reset").addEventListener("click", () => {
  document
    .querySelectorAll(".filters input[type=checkbox]")
    .forEach((c) => (c.checked = false));
  $("f-reviews-min").value = 100;
  $("f-rating-min").value = 4;
  $("f-maxreviews-val").value = 50;
  $("f-maxrating-val").value = 3.5;
  $("f-cat-val").value = "";
  if (allLeads.length) refreshPills();
});

// Re-count whenever a filter changes.
document
  .querySelectorAll(".filters input")
  .forEach((el) => el.addEventListener("input", () => {
    if (allLeads.length) refreshPills();
  }));

// Restore last scrape when the popup opens.
chrome.storage.local.get("lastLeads", ({ lastLeads }) => {
  if (Array.isArray(lastLeads) && lastLeads.length) {
    allLeads = lastLeads;
    refreshPills();
    $("result").classList.remove("hidden");
    setStatus(`Showing ${lastLeads.length} leads from your last scrape.`);
  }
});
