// === Global setup ===
let fillers = JSON.parse(localStorage.getItem("fillers")) || ["Ah", "Um", "You know", "So", "Like", "Other"];
let defaultNames = JSON.parse(localStorage.getItem("speakers")) || [
  "Steve", "Jarrod", "Arielle", "Dave", "Khan", "Sandy", "Len", "Anthony"
];

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

function saveData() {
  localStorage.setItem("fillers", JSON.stringify(fillers));
  localStorage.setItem("speakers", JSON.stringify(Object.keys(counts)));
}

function buildTable() {
  const container = document.getElementById("participantContainer");
  container.innerHTML = "";

  // === Instruction Header ===
  const headerNote = document.createElement("div");
  headerNote.className = "tip-header";
  headerNote.innerHTML = `
    💡 <strong>How to Use:</strong> Left-click adds +1, right-click subtracts −1, click <span class="remove-sample">×</span> to remove a speaker.
  `;
  container.appendChild(headerNote);

  const table = document.createElement("table");
  table.className = "counter-table";

  // Header
  const headerRow = document.createElement("tr");
  headerRow.innerHTML = `
    <th>Speaker</th>
    <th>Total</th>
    ${fillers.map(f => `<th>${f}</th>`).join("")}
  `;
  table.appendChild(headerRow);

  // Body
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

  // === Event bindings ===
  document.querySelectorAll(".filler-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      const name = e.target.dataset.name;
      const filler = e.target.dataset.filler;
      handleClick(name, filler, 1);
    });
    btn.addEventListener("contextmenu", e => {
      e.preventDefault();
      const name = e.target.dataset.name;
      const filler = e.target.dataset.filler;
      handleClick(name, filler, -1);
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
}

// === Handle clicks (with persistent storage) ===
function handleClick(name, filler, delta = 1) {
  clickSound.currentTime = 0;
  clickSound.play().catch(() => {});

  let actual = filler;

  if (filler === "Other") {
    const custom = prompt("Enter custom filler word:");
    if (!custom) return;
    actual = custom.trim();

    // Insert before "Other" if new
    if (!fillers.includes(actual)) {
      fillers.splice(fillers.length - 1, 0, actual);
      Object.keys(counts).forEach(n => {
        counts[n].details[actual] = counts[n].details[actual] || 0;
      });
      saveData();
      buildTable();
    }
  }

  const current = counts[name].details[actual] || 0;
  const newCount = Math.max(0, current + delta);
  counts[name].details[actual] = newCount;
  counts[name].total = Object.values(counts[name].details).reduce((a, b) => a + b, 0);

  saveData();
  buildTable();
}

// === Add / Reset Buttons ===
document.getElementById("addCustom").addEventListener("click", () => {
  const name = prompt("Enter speaker name:");
  if (!name || counts[name]) return;
  counts[name] = { total: 0, details: {} };
  fillers.forEach(f => (counts[name].details[f] = 0));
  saveData();
  buildTable();
});

document.getElementById("resetAll").addEventListener("click", () => {
  if (!confirm("Reset all counts?")) return;
  Object.keys(counts).forEach(n => {
    counts[n].total = 0;
    fillers.forEach(f => (counts[n].details[f] = 0));
  });
  saveData();
  buildTable();
});

// === Summary Modal ===
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

showSummaryBtn.addEventListener("click", () => {
  let html = "";
  for (const [name, data] of Object.entries(counts)) {
    html += `<div style="margin-bottom:6px;"><strong>${name}</strong>: ${data.total}</div>`;
    for (const [f, c] of Object.entries(data.details)) {
      if (c > 0) html += `<div class='sub'>– ${f}: ${c}</div>`;
    }
  }
  summaryList.innerHTML = html || "<em>No counts yet.</em>";
  modal.style.display = "flex";
  showSummaryBtn.style.display = "none";
  hideSummaryBtn.style.display = "inline-block";
});

hideSummaryBtn.addEventListener("click", hideModal);
closeBtn.addEventListener("click", hideModal);

function hideModal() {
  modal.style.display = "none";
  hideSummaryBtn.style.display = "none";
  showSummaryBtn.style.display = "inline-block";
}

copyBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(summaryList.innerText.trim());
  copyBtn.textContent = "Copied!";
  setTimeout(() => (copyBtn.textContent = "Copy"), 1500);
});
