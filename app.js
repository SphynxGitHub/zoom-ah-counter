// === Global setup ===
let fillers = JSON.parse(localStorage.getItem("fillers")) || ["Ah", "Um", "You know", "So", "Like", "Other"];
// Ensure "Other" always exists and is last
if (!fillers.includes("Other")) fillers.push("Other");
let defaultNames = JSON.parse(localStorage.getItem("speakers")) || [
  "Steve", "Jarrod", "Arielle", "Dave", "Khan", "Sandy", "Len", "Anthony", "Renson"
];

let counts = {};
let clickSound = new Audio("sounds/pop.wav");
clickSound.preload = "auto";

// === Element references ===
const modal          = document.getElementById("summaryModal");
const summaryList    = document.getElementById("summaryList");
const copyBtn        = document.getElementById("copySummary");
const closeBtn       = document.getElementById("closeSummary");
const showSummaryBtn = document.getElementById("showSummary");
const addSpeakerBtn  = document.getElementById("addSpeaker");
const resetAllBtn    = document.getElementById("resetAll");

// Create “Hide Summary” button if missing
let hideSummaryBtn = document.getElementById("hideSummary");
if (!hideSummaryBtn) {
  hideSummaryBtn = document.createElement("button");
  hideSummaryBtn.id = "hideSummary";
  hideSummaryBtn.textContent = "Hide Summary";
  hideSummaryBtn.style.display = "none";
  showSummaryBtn.insertAdjacentElement("afterend", hideSummaryBtn);
}

// === Initialize on load ===
window.addEventListener("DOMContentLoaded", () => {
  defaultNames.forEach(name => {
    counts[name] = { total: 0, details: {} };
    fillers.forEach(f => (counts[name].details[f] = 0));
  });
  buildTable();
});

// === Save data ===
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

// === Handle clicks ===
function handleClick(name, filler, delta = 1, buttonEl) {
  if (delta > 0) {
    clickSound.currentTime = 0;
    clickSound.play().catch(() => {});
  }

  const current = counts[name].details[filler] || 0;
  const newCount = Math.max(0, current + delta);
  counts[name].details[filler] = newCount;
  counts[name].total = Object.values(counts[name].details).reduce((a, b) => a + b, 0);

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

  const table = document.createElement("table");
  table.className = "counter-table";

  // === Header Row 1 ===
  const headerRow1 = document.createElement("tr");
  headerRow1.innerHTML = `
    <th rowspan="2">Speaker</th>
    <th rowspan="2">Total</th>
    ${fillers
      .map((f, i) => {
        const isOther = f.toLowerCase() === "other";
        return `<th>${f}${!isOther ? ` <span class="remove-filler" data-index="${i}" title="Remove '${f}'">×</span>` : ""}</th>`;
      })
      .join("")}
  `;
  table.appendChild(headerRow1);

  // === Header Row 2 ===
  const headerRow2 = document.createElement("tr");
  headerRow2.innerHTML = fillers
    .map(
      f =>
        `<th class="sub-total" data-filler="${f}">${Object.values(counts).reduce(
          (sum, s) => sum + (s.details[f] || 0),
          0
        )}</th>`
    )
    .join("");
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

  document.querySelectorAll(".remove-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      const name = e.target.dataset.name;
      delete counts[name];
      saveData();
      buildTable();
    });
  });

  document.querySelectorAll(".remove-filler").forEach(icon => {
    icon.addEventListener("click", e => {
      const index = parseInt(e.target.dataset.index);
      const fillerToRemove = fillers[index];
      if (fillerToRemove.toLowerCase() === "other") return;
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
addSpeakerBtn.addEventListener("click", () => {
  const name = prompt("Enter speaker name:");
  if (!name) return;
  const clean = name.trim();
  if (!clean || counts[clean]) return;

  counts[clean] = { total: 0, details: {} };
  fillers.forEach(f => (counts[clean].details[f] = 0));
  saveData();
  buildTable();
});

// === Reset All ===
resetAllBtn.addEventListener("click", () => {
  if (!confirm("Clear all counts?")) return;
  Object.keys(counts).forEach(name => {
    counts[name].total = 0;
    for (const f in counts[name].details) counts[name].details[f] = 0;
  });
  saveData();
  buildTable();
});

// === Summary Modal ===
showSummaryBtn.addEventListener("click", () => {
  let html = "";
  for (const [name, data] of Object.entries(counts)) {
    html += `<div style="margin-bottom:6px;"><strong>${name}</strong>: ${data.total}</div>`;
    for (const [f, c] of Object.entries(data.details)) {
      if (c > 0) html += `<div class='sub'>– ${f}: ${c}</div>`;
    }
  }

  html += `<hr><div><strong>Overall Totals</strong></div>`;
  fillers.forEach(f => {
    const total = Object.values(counts).reduce((sum, s) => sum + (s.details[f] || 0), 0);
    html += `<div class='sub'>${f}: ${total}</div>`;
  });

  summaryList.innerHTML = html || "<em>No counts yet.</em>";
  modal.classList.add("show");
  showSummaryBtn.style.display = "none";
  hideSummaryBtn.style.display = "inline-block";
});

function hideModal() {
  modal.classList.remove("show");
  hideSummaryBtn.style.display = "none";
  showSummaryBtn.style.display = "inline-block";
}
hideSummaryBtn.addEventListener("click", hideModal);
closeBtn.addEventListener("click", hideModal);

copyBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(summaryList.innerText.trim());
  copyBtn.textContent = "Copied!";
  setTimeout(() => (copyBtn.textContent = "Copy"), 1500);
});
