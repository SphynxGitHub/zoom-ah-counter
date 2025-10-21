const fillers = ["Ah", "Um", "You know", "So", "Like", "Other"];
const defaultNames = ["Steve", "Jarrod", "Arielle", "Dave", "Khan", "Sandy", "Len", "Anthony"];

let counts = {};
let clickSound = new Audio("sounds/pop.wav");
clickSound.preload = "auto";

window.addEventListener("DOMContentLoaded", () => {
  defaultNames.forEach(name => {
    counts[name] = { total: 0, details: {} };
    fillers.forEach(f => (counts[name].details[f] = 0));
  });
  buildTable();
});

function buildTable() {
  const container = document.getElementById("participantContainer");
  container.innerHTML = "";

  const table = document.createElement("table");
  table.className = "counter-table";

  // Header row
  const headerRow = document.createElement("tr");
  headerRow.innerHTML = `
    <th>Speaker</th>
    <th>Total</th>
    ${fillers.map(f => `<th>${f}</th>`).join("")}
    <th></th>
  `;
  table.appendChild(headerRow);

  // Body rows
  Object.keys(counts).forEach(name => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="name">${name}</td>
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
      <td><span class="remove-btn" data-name="${name}">×</span></td>
    `;
    table.appendChild(row);
  });

  container.appendChild(table);

  // Add tooltip below table
  const tip = document.createElement("div");
  tip.className = "tip";
  tip.innerHTML = "💡 Tip: Left-click to add +1, right-click to undo (−1).";
  container.appendChild(tip);

  // Filler button clicks
  document.querySelectorAll(".filler-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      const name = e.target.dataset.name;
      const filler = e.target.dataset.filler;
      handleClick(name, filler, 1);
    });

    // Right-click (undo)
    btn.addEventListener("contextmenu", e => {
      e.preventDefault();
      const name = e.target.dataset.name;
      const filler = e.target.dataset.filler;
      handleClick(name, filler, -1);
    });
  });

  // Remove speaker
  document.querySelectorAll(".remove-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      const name = e.target.dataset.name;
      delete counts[name];
      buildTable();
    });
  });
}

function handleClick(name, filler, delta = 1) {
  clickSound.currentTime = 0;
  clickSound.play().catch(() => {});

  let actual = filler;

  // ✅ Handle "Other" → prompt for custom filler
  if (filler === "Other") {
    const custom = prompt("Enter custom filler word:");
    if (!custom) return;
    actual = custom.trim();

    // If new filler, add it as a new column
    if (!fillers.includes(actual)) {
      fillers.push(actual);
      Object.keys(counts).forEach(n => {
        counts[n].details[actual] = counts[n].details[actual] || 0;
      });
      buildTable();
    }
  }

  // Update count
  const current = counts[name].details[actual] || 0;
  const newCount = Math.max(0, current + delta);
  counts[name].details[actual] = newCount;

  // Recalculate total
  counts[name].total = Object.values(counts[name].details).reduce((a, b) => a + b, 0);
  buildTable();
}

document.getElementById("addCustom").addEventListener("click", () => {
  const name = prompt("Enter speaker name:");
  if (!name || counts[name]) return;
  counts[name] = { total: 0, details: {} };
  fillers.forEach(f => (counts[name].details[f] = 0));
  buildTable();
});

document.getElementById("resetAll").addEventListener("click", () => {
  Object.keys(counts).forEach(n => {
    counts[n].total = 0;
    fillers.forEach(f => (counts[n].details[f] = 0));
  });
  buildTable();
});

// === Summary modal ===
const modal = document.getElementById("summaryModal");
const summaryList = document.getElementById("summaryList");
const copyBtn = document.getElementById("copySummary");
const closeBtn = document.getElementById("closeSummary");

document.getElementById("showSummary").addEventListener("click", () => {
  let html = "";
  for (const [name, data] of Object.entries(counts)) {
    html += `<div><strong>${name}</strong>: ${data.total}</div>`;
    for (const [f, c] of Object.entries(data.details))
      html += `<div class='sub'>– ${f}: ${c}</div>`;
  }
  summaryList.innerHTML = html || "<em>No counts yet.</em>";
  modal.classList.remove("hidden");

  copyBtn.onclick = () => {
    navigator.clipboard.writeText(summaryList.innerText.trim());
    copyBtn.textContent = "Copied!";
    setTimeout(() => (copyBtn.textContent = "Copy"), 1500);
  };
});

closeBtn.addEventListener("click", () => modal.classList.add("hidden"));
