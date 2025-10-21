// === Global setup ===
let fillers = JSON.parse(localStorage.getItem("fillers")) || ["Ah", "Um", "You know", "So", "Like", "Other"];
let defaultNames = JSON.parse(localStorage.getItem("speakers")) || [
  "Steve", "Jarrod", "Arielle", "Dave", "Khan", "Sandy", "Len", "Anthony", "Renson"
];

// Summary elements (ensure these exist before adding listeners)
const modal          = document.getElementById("summaryModal");
const summaryList    = document.getElementById("summaryList");
const copyBtn        = document.getElementById("copySummary");
const closeBtn       = document.getElementById("closeSummary");
const showSummaryBtn = document.getElementById("showSummary");

// Create/ensure Hide Summary button right after Show
let hideSummaryBtn = document.getElementById("hideSummary");
if (!hideSummaryBtn) {
  hideSummaryBtn = document.createElement("button");
  hideSummaryBtn.id = "hideSummary";
  hideSummaryBtn.textContent = "Hide Summary";
  hideSummaryBtn.style.display = "none";
  showSummaryBtn.insertAdjacentElement("afterend", hideSummaryBtn);
}

let counts = {};
let clickSound = new Audio("sounds/pop.wav");
clickSound.preload = "auto";

// === Initialize on load ===
window.addEventListener("DOMContentLoaded", () => {
  defaultNames.forEach(name => {
    counts[name] = { total: 0, details: {} };
    fillers.forEach(f => (counts[name].details[f] = 0));
  });
  buildTable();
});

// === Save data to localStorage ===
function saveData() {
  localStorage.setItem("fillers", JSON.stringify(fillers));
  localStorage.setItem("speakers", JSON.stringify(Object.keys(counts)));
}

// === Update header totals live ===
function updateHeaderTotals() {
  document.querySelectorAll(".sub-total").forEach(cell => {
    const filler = cell.dataset.filler;
    const total = Object.values(counts).reduce(
      (sum, s) => sum + (s.details[filler] || 0),
      0
    );
    cell.textContent = total;
  });
}

// === Handle clicks for each filler button ===
function handleClick(name, filler, delta = 1, buttonEl) {
  // Only play sound when adding
  if (delta > 0) {
    clickSound.currentTime = 0;
    clickSound.play().catch(() => {});
  }

  const current = counts[name].details[filler] || 0;
  const newCount = Math.max(0, current + delta);
  counts[name].details[filler] = newCount;
  counts[name].total = Object.values(counts[name].details).reduce((a, b) => a + b, 0);

  // Update UI live
  if (buttonEl) buttonEl.textContent = newCount;
  const totalCell = document.getElementById(`total-${name}`);
  if (totalCell) totalCell.textContent = counts[name].total;
  updateHeaderTotals();

  saveData();
}

// === Build full table ===
function buildTable() {
  const container = document.getElementById("participantContainer");
  container.innerHTML = "";

  // === Sub-header always under the page title ===
  let usage = document.getElementById("usageHeader");
  if (!usage) {
    const title = document.querySelector("h1");
    usage = document.createElement("div");
    usage.id = "usageHeader";
    usage.className = "subheader";
    title.insertAdjacentElement("afterend", usage);
  }
  usage.innerHTML = `
    💡 <strong>How to Use:</strong> Left-click adds +1, right-click subtracts −1. 
    Click <span class="remove-sample">×</span> to remove a speaker or filler word.
  `;
  const table = document.createElement("table");
  table.className = "counter-table";

  // === Calculate totals for each filler ===
  const fillerTotals = fillers.map(f =>
    Object.values(counts).reduce((acc, s) => acc + (s.details[f] || 0), 0)
  );

  // === Header Row 1: filler names + remove icons (except “Other”) ===
  const headerRow1 = document.createElement("tr");
  headerRow1.innerHTML = `
    <th rowspan="2">Speaker</th>
    <th rowspan="2">Total</th>
    ${fillers.map((f, i) => {
      // “Other” cannot be removed
      const removable = f !== "Other";
      return `<th>${f}${removable ? ` <span class="remove-filler" data-index="${i}" title="Remove '${f}'">×</span>` : ""}</th>`;
    }).join("")}
  `;
  
  // === Header Row 2: totals directly below each filler (NO extra blanks) ===
  const headerRow2 = document.createElement("tr");
  headerRow2.innerHTML =
    fillers.map((f, i) =>
      `<th class="sub-total" data-filler="${f}">${
        Object.values(counts).reduce((sum, s) => sum + (s.details[f] || 0), 0)
      }</th>`
    ).join("");
  table.appendChild(headerRow2);

  // === Speaker Rows ===
  Object.keys(counts).forEach(name => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="name">
        <span class="speaker-text">${name}</span>
        <span class="remove-btn" data-name="${name}" title="Remove ${name}">×</span>
      </td>
      <td class="total" id="total-${name}">${counts[name].total}</td>
      ${fillers
        .map(
          f => `
          <td>
            <button class="filler-btn" data-name="${name}" data-filler="${f}">
              ${counts[name].details[f] || 0}
            </button>
          </td>`
        )
        .join("")}
    `;
    table.appendChild(row);
  });

  container.appendChild(table);

  // === Event Listeners ===
  document.querySelectorAll(".filler-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      const { name, filler } = e.target.dataset;
      handleClick(name, filler, 1, e.target);
    });
    btn.addEventListener("contextmenu", e => {
      e.preventDefault();
      const { name, filler } = e.target.dataset;
      handleClick(name, filler, -1, e.target);
    });
  });

  // Remove speaker
  document.querySelectorAll(".remove-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      const name = e.target.dataset.name;
      delete counts[name];
      saveData();
      buildTable();
    });
  });

  // Remove filler (including "Other")
  document.querySelectorAll(".remove-filler").forEach(icon => {
    icon.addEventListener("click", e => {
      const index = parseInt(e.target.dataset.index);
      const fillerToRemove = fillers[index];
      if (confirm(`Remove filler '${fillerToRemove}' from all speakers?`)) {
        fillers.splice(index, 1);
        Object.values(counts).forEach(speaker => {
          delete speaker.details[fillerToRemove];
          speaker.total = Object.values(speaker.details).reduce((a, b) => a + b, 0);
        });
        saveData();
        buildTable();
      }
    });
  });
}

// === Add Speaker ===
document.getElementById("addCustom").addEventListener("click", () => {
  const name = prompt("Enter speaker name:");
  if (!name || counts[name]) return;
  counts[name] = { total: 0, details: {} };
  fillers.forEach(f => (counts[name].details[f] = 0));
  saveData();
  buildTable();
});

// === Reset All ===
document.getElementById("resetAll").addEventListener("click", () => {
  if (!confirm("Reset all counts?")) return;
  Object.keys(counts).forEach(n => {
    counts[n].total = 0;
    fillers.forEach(f => (counts[n].details[f] = 0));
  });
  saveData();
  buildTable();
});

// === Summary Modal Logic ===
const modal = document.getElementById("summaryModal");
const summaryList = document.getElementById("summaryList");
const copyBtn = document.getElementById("copySummary");
const closeBtn = document.getElementById("closeSummary");
const showSummaryBtn = document.getElementById("showSummary");
let hideSummaryBtn = document.getElementById("hideSummary");

if (!hideSummaryBtn) {
  hideSummaryBtn = document.createElement("button");
  hideSummaryBtn.id = "hideSummary";
  hideSummaryBtn.textContent = "Hide Summary";
  hideSummaryBtn.style.display = "none";
  showSummaryBtn.insertAdjacentElement("afterend", hideSummaryBtn);
}

// Show Summary
showSummaryBtn.addEventListener("click", () => {
  let html = "";
  for (const [name, data] of Object.entries(counts)) {
    html += `<div style="margin-bottom:6px;"><strong>${name}</strong>: ${data.total}</div>`;
    for (const [f, c] of Object.entries(data.details)) {
      if (c > 0) html += `<div class='sub'>– ${f}: ${c}</div>`;
    }
  }

  // Overall totals section
  html += `<hr><div><strong>Overall Totals</strong></div>`;
  fillers.forEach(f => {
    const total = Object.values(counts).reduce((sum, s) => sum + (s.details[f] || 0), 0);
    html += `<div class='sub'>${f}: ${total}</div>`;
  });

  summaryList.innerHTML = html || "<em>No counts yet.</em>";
  modal.style.display = "flex";
  showSummaryBtn.style.display = "none";
  hideSummaryBtn.style.display = "inline-block";
});

// Hide Summary (both buttons)
function hideModal() {
  modal.style.display = "none";
  hideSummaryBtn.style.display = "none";
  showSummaryBtn.style.display = "inline-block";
}
hideSummaryBtn.addEventListener("click", hideModal);
closeBtn.addEventListener("click", hideModal);

// Copy Summary
copyBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(summaryList.innerText.trim());
  copyBtn.textContent = "Copied!";
  setTimeout(() => (copyBtn.textContent = "Copy"), 1500);
});
