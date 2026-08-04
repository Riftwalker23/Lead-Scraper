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
  try {
    await navigator.clipboard.writeText(tsv);
    return true;
  } catch {
    // Fallback via a hidden textarea.
    const ta = document.createElement("textarea");
    ta.value = tsv;
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
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

async function doScrape() {
  const btn = $("scrape");
  const tab = await getActiveTab();

  if (!isMapsUrl(tab.url)) {
    setStatus(
      "Open Google Maps and run a search first (e.g. 'gyms in Karachi'), then click Scrape.",
      "error"
    );
    return;
  }

  btn.disabled = true;
  $("result").classList.add("hidden");
  setStatus("Loading & scrolling results… this can take a moment.", "working");

  const ready = await ensureContentScript(tab.id);
  if (!ready) {
    setStatus("Couldn't start the scraper on this tab. Reload the page and retry.", "error");
    btn.disabled = false;
    return;
  }

  const autoScroll = $("opt-autoscroll").checked;

  chrome.tabs.sendMessage(tab.id, { type: "SCRAPE", autoScroll }, (resp) => {
    btn.disabled = false;

    if (chrome.runtime.lastError) {
      setStatus(
        "Scraper didn't respond. Reload the Maps tab and try again.",
        "error"
      );
      return;
    }
    if (!resp || !resp.ok) {
      setStatus((resp && resp.error) || "Scrape failed.", "error");
      return;
    }

    allLeads = resp.data || [];
    if (allLeads.length === 0) {
      setStatus("No leads found on this page.", "error");
      return;
    }

    clearStatus();
    refreshPills();
    $("result").classList.remove("hidden");
    chrome.storage.local.set({ lastLeads: allLeads });
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

$("sheet").addEventListener("click", async () => {
  const leads = getFilteredLeads();
  if (!leads.length) return setStatus("No leads match the filters.", "error");
  const ok = await copyLeads(leads);
  // Opens a brand-new Google Sheet, ready for Ctrl+V in A1.
  await chrome.tabs.create({ url: "https://sheets.new" });
  setStatus(
    ok
      ? `Copied ${leads.length} leads. In the new Sheet, click A1 and press Ctrl+V.`
      : "Opened Sheet, but copy failed — use Download CSV then File → Import.",
    ok ? "" : "error"
  );
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
