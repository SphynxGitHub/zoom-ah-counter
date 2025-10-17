const fillers = ["Ah", "Um", "You know", "So", "Like", "Other"];
let counts = {}; // { name: { total: n, details: {Ah: n, Um: n, ...}} }
let popSound = new Audio("sounds/pop.wav");
popSound.preload = "auto";

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
      <div class="word">${name}</div>
      <div class="count" id="count-${name}">${counts[name].total}</div>
      <div class="fillers">
        ${fillers.map(f => `<button class="filler-btn" data-name="${name}" data-filler="${f}">${f}</button>`).join("")}
      </div>
    `;
    container.appendChild(div);
  });

  // Attach filler click events
  document.querySelectorAll(".filler-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      const name = e.target.dataset.name;
      const filler = e.target.dataset.filler;
      handleClick(name, filler);
    });
  });
}

function handleClick(name, filler) {
  clickSound.currentTime = 0;
  clickSound.play().catch(() => {});

  let actualFiller = filler;
  if (filler === "Other") {
    const custom = prompt("Enter custom filler word:");
    if (!custom) return;
    actualFiller = custom.trim();
    if (!counts[name].details[actualFiller]) counts[name].details[actualFiller] = 0;
  }

  counts[name].total++;
  counts[name].details[actualFiller] = (counts[name].details[actualFiller] || 0) + 1;

  document.getElementById(`count-${name}`).textContent = counts[name].total;
}

document.getElementById("addCustom").addEventListener("click", () => {
  const name = prompt("Enter speaker name:");
  if (!name || counts[name]) return;
  counts[name] = { total: 0, details: {} };
  buildParticipantGrid();
});

document.getElementById("resetAll").addEventListener("click", () => {
  Object.keys(counts).forEach(name => counts[name] = { total: 0, details: {} });
  buildParticipantGrid();
});

const modal = document.getElementById("summaryModal");
const summaryList = document.getElementById("summaryList");
const copyBtn = document.getElementById("copySummary");
const closeBtn = document.getElementById("closeSummary");

document.getElementById("showSummary").addEventListener("click", () => {
  let text = "";
  let html = "";
  for (const [name, data] of Object.entries(counts)) {
    html += `<div><strong>${name}</strong>: ${data.total}</div>`;
    text += `${name}: ${data.total}\n`;
    for (const [filler, count] of Object.entries(data.details)) {
      html += `<div class="sub">– ${filler}: ${count}</div>`;
      text += `   - ${filler}: ${count}\n`;
    }
  }
  summaryList.innerHTML = html || "<em>No counts yet.</em>";
  modal.classList.remove("hidden");

  copyBtn.onclick = () => {
    navigator.clipboard.writeText(text.trim());
    copyBtn.textContent = "Copied!";
    setTimeout(() => (copyBtn.textContent = "Copy"), 1500);
  };
});
closeBtn.addEventListener("click", () => modal.classList.add("hidden"));
