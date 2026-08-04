/* Renders the leads saved by the popup into a printable table, then opens the
 * print dialog so the user can "Save as PDF". */

const COLUMNS = [
  ["name", "Name"],
  ["phone", "Phone"],
  ["website", "Website"],
  ["rating", "Rating"],
  ["reviews", "Reviews"],
  ["category", "Category"],
  ["address", "Address"],
  ["status", "Open Status"],
];

function esc(s) {
  const d = document.createElement("div");
  d.textContent = String(s ?? "");
  return d.innerHTML;
}

function render(leads) {
  const content = document.getElementById("content");
  if (!leads || !leads.length) {
    content.innerHTML = '<div class="empty">No leads to show.</div>';
    return;
  }

  const head = COLUMNS.map((c) => `<th>${c[1]}</th>`).join("");
  const body = leads
    .map((l) => {
      const cells = COLUMNS.map(([key]) => {
        let v = l[key];
        if (key === "website" && v)
          return `<td><a href="${esc(v)}">${esc(v)}</a></td>`;
        if (v === null || v === undefined) v = "";
        return `<td>${esc(v)}</td>`;
      }).join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  content.innerHTML = `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

document.getElementById("print").addEventListener("click", () => window.print());

chrome.storage.local.get("printLeads", ({ printLeads }) => {
  const leads = (printLeads && printLeads.leads) || [];
  render(leads);

  const stamp = new Date().toLocaleString();
  document.getElementById(
    "meta"
  ).textContent = `${leads.length} leads · exported ${stamp}`;

  // Auto-open the print dialog once the table is on screen.
  if (leads.length) setTimeout(() => window.print(), 500);
});
