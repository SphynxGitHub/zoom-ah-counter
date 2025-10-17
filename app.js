const fillers = ["Ah", "Um", "You know", "So", "Like", "Other"];

// ✅ preload these names
const defaultNames = ["Steve", "Jarrod", "Arielle", "Dave", "Khan", "Sandy", "Len", "Anthony"];

let counts = {};
let clickSound = new Audio("sounds/pop.wav");
clickSound.preload = "auto";

// Initialize with default participants
window.addEventListener("DOMContentLoaded", () => {
  defaultNames.forEach(name => {
    counts[name] = { total: 0, details: {} };
  });
  buildParticipantGrid();
});

function buildParticipantGrid() {
  const container = document.getElementById("participantContainer");
  container.innerHTML = "";

  const names = Object.keys(counts);
  if (names.length === 0) {
    container.innerHTML = "<div class='loading'>Add participants to begin</div>";
    return;
  }

  names.forEach(name => {
    const div = document.createElement("div");
    div.className = "word-card";
    div.innerHTML = `
      <div class="remove-btn" title="Remove ${name}">×</div>
      <div class="word">${name}</div>
      <div class="count" id="count-${name}">${counts[name].total}</div>
      <div class="fillers">
        ${fillers.map(f => `<button class="filler-btn" data-name="${name}" data-filler="${f}">${f}</button>`).join("")}
      </div>
    `;
    container.appendChild(div);
  });

  // filler click events
  document.querySelectorAll(".filler-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      const name = e.target.dataset.name;
      const filler = e.target.dataset.filler;
      handleClick(name, filler);
    });
  });

  // remove button events
  document.querySelectorAll(".remove-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      const parent = e.target.closest(".word-card");
      const name = parent.querySelector(".word").textContent;
      delete counts[name];
      buildParticipantGrid();
    });
  });
}

function handleClick(name, filler) {
  clickSound.currentTime = 0;
  clickSound.play().catch(() => {});

  if (!counts[name]) counts[name] = { total: 0, details: {} };

  let actual = filler;
  if (filler === "Other") {
    const custom = prompt("Enter custom filler word:");
    if (!custom) return;
    actual = custom.trim();
  }

  counts[name].total++;
  counts[name].details[actual] = (counts[name].details[actual] || 0) + 1;

  document.getElementById(`count-${name}`).textContent = counts[name].total;
}

// add new participant manually
document.getElementById("addCustom").addEventListener("click", () => {
  const name = prompt("Enter speaker name:");
  if (!name || counts[name]) return;
  counts[name] = { total: 0, details: {} };
  buildParticipantGrid();
});

// reset all counts
document.getElementById("resetAll").addEventListener("click", () => {
  Object.keys(counts).forEach(n => counts[n] = { total: 0, details: {} });
  buildParticipantGrid();
});

// summary modal
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
