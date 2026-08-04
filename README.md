# 📍 Maps Lead Scraper — Chrome Extension

Scrape business leads straight from **Google Maps search results** — name, phone,
website, rating, reviews, category, address and open/closed status — then filter
them and export to a **Google Sheet, clipboard, or CSV** in one click.

Perfect for agencies, freelancers, and sales teams doing local outreach
(e.g. *"gyms in Karachi"*, *"dentists in London"*, *"restaurants near me"*).

> ⚠️ This extension is **not** published on the Chrome Web Store. You install it
> manually as an "unpacked extension" (developer mode). Full steps below.

---

## ✨ Features

- **One-click scraping** of every business in the current Maps search — it
  auto-scrolls the results panel to load them all (name, rating, reviews,
  category, address, open/closed status).
- **📞 Get phone & website** — Google doesn't show phone numbers or websites in
  the results list, only on each business's own page. This button briefly opens
  your **filtered** leads in the background and pulls their phone + website, so
  you only fetch the ones you actually want.
- **10 smart filters:**
  - Has phone number
  - Has website
  - **No website** (great for web-design / site-building leads)
  - Open now
  - Minimum reviews / **Maximum reviews** (find under-marketed businesses)
  - Minimum rating / **Maximum rating** (find reputation-management leads)
  - Category includes (keyword match)
  - Hide sponsored ("Ad") listings
- **Live preview list** — see the leads and their badges update as you toggle filters.
- **Export options:**
  - 📋 **Copy** — data goes to your clipboard as tab-separated values (paste into any sheet)
  - 📊 **Google Sheets** — copies the leads and opens a fresh sheet; a reminder
    banner appears in the sheet — click cell **A1** and press **`Ctrl+V`**
    (browsers don't allow extensions to auto-paste, so this last keystroke is on you)
  - 📝 **Google Docs** — copies the leads as a formatted **table** and opens a new
    Doc; click in it and press **`Ctrl+V`**
  - 📄 **PDF** — opens a clean print-ready page and the print dialog; choose
    **Save as PDF**
  - ⬇️ **Download CSV**
- **▶ Try demo** — loads sample data so you can see the whole flow without opening Maps.

---

## 🧩 Installation (Chrome / Edge / Brave — any Chromium browser)

Because it's not on the Web Store, you load it as an **unpacked extension**.
This takes about a minute.

### 1. Get the code

**Option A — clone with Git:**

```bash
git clone https://github.com/Riftwalker23/Lead-Scraper.git
```

**Option B — download ZIP:**
Click the green **`< > Code`** button on the GitHub page → **Download ZIP** →
extract it somewhere you'll remember (e.g. `Desktop`).

### 2. Open the Extensions page

In your browser's address bar, go to:

```
chrome://extensions
```

*(On Edge use `edge://extensions`, on Brave `brave://extensions`.)*

### 3. Turn on Developer mode

Flip the **Developer mode** toggle in the **top-right corner** of that page.

### 4. Load the extension

- Click **Load unpacked**.
- Select the folder you cloned/extracted — the one that contains
  **`manifest.json`** (the `Lead-Scraper` folder).
- The **📍 Maps Lead Scraper** card appears. Done!

### 5. Pin it (optional but handy)

Click the puzzle-piece 🧩 icon in the toolbar and pin **Maps Lead Scraper**
so its 📍 icon stays visible.

---

## 🚀 How to use

1. Go to **[google.com/maps](https://www.google.com/maps)** and search for what
   you want, e.g. **`gyms in Karachi`**. Wait for the list of results to appear.
2. Click the **📍 extension icon** in your toolbar.
3. Tick the **filters** you want (or leave them all off to grab everything).
4. Click **Scrape leads**. It scrolls the whole list and collects every business
   (large searches can take 20–60 seconds).
5. Review the **live preview** and counts. Adjust filters — the list updates instantly.
6. *(Optional)* Click **📞 Get phone & website** to fetch those two fields for the
   currently filtered leads. It opens each listing in a background tab for a
   moment — **keep the popup open** while it runs. (Filter first so you only
   fetch the leads you care about — it's much faster.)
7. Export:
   - **Copy**, then paste into any spreadsheet, **or**
   - **Google Sheet** → in the new sheet, click cell **A1** and press **`Ctrl+V`**, **or**
   - **Download CSV**.

Want to see it before running a real search? Click **▶ Try demo** in the popup.

---

## 📦 Exported columns

| Name | Phone | Website | Rating | Reviews | Category | Address | Open Status | Google Maps URL |
|------|-------|---------|--------|---------|----------|---------|-------------|-----------------|

---

## 🔄 Updating the extension

When you pull new code (`git pull`) or download a newer ZIP, go back to
`chrome://extensions` and click the **↻ reload** icon on the extension card to
apply the changes.

---

## 🛠️ Project structure

```
Lead-Scraper/
├── manifest.json     # Extension config (Manifest V3)
├── popup.html        # The popup UI
├── popup.css         # Popup styling
├── popup.js          # Popup logic: filters, export, demo, preview
├── content.js        # Runs on Google Maps: scrolls + scrapes each listing
├── print.html        # Print-ready leads page for PDF export
├── print.js          # Renders the table and opens the print dialog
├── make_icons.py     # (Dev only) regenerates the PNG icons, no dependencies
└── icons/            # 16 / 48 / 128 px toolbar icons
```

---

## ❓ Troubleshooting

- **"No results feed found"** — Make sure you ran a search on `google.com/maps`
  and the list of businesses is visible **before** clicking Scrape.
- **Phone / Website columns are blank after scraping** — that's expected: Google
  doesn't put them in the results list. Click **📞 Get phone & website** to fetch
  them. Anything still blank means the business hasn't published it.
- **"Get phone & website" seems slow** — it opens each listing in a background tab
  to read the real number/site, ~1–2s each. Filter your list down first, then
  enrich only those leads.
- **Nothing scrapes / it broke after a while** — Google Maps periodically changes
  its page structure. The selectors live in `content.js`; they use layered
  fallbacks, but a future Maps update may need a tweak there.
- **Scraper didn't respond** — Reload the Maps tab, then try again.

---

## ⚖️ Notes

This tool reads the **publicly visible** business information already shown on
Google Maps. You are responsible for how you use scraped data — comply with
Google's Terms of Service and any applicable privacy/marketing laws (e.g. GDPR,
local anti-spam rules) in your outreach.

---

## 📄 License

MIT — free to use, modify, and share.
