let counts = {};
let clickSound = new Audio("sounds/click.mp3");
clickSound.preload = "auto";

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
      <div class="count" id="count-${name}">${counts[name]}</div>
    `;
    div.addEventListener("click", () => handleClick(name));
    container.appendChild(div);
  });
}

function handleClick(name) {
  clickSound.currentTime = 0;
  clickSound.play().catch(() => {});
  counts[name]++;
  document.getElementById(`count-${name}`).textContent = counts[name];
}

document.getElementById("addCustom").addEventListener("click", () => {
  const name = prompt("Enter speaker name:");
  if (!name || counts[name]) return;
  counts[name] = 0;
  buildParticipantGrid();
});

document.getElementById("resetAll").addEventListener("click", () => {
  Object.keys(counts).forEach(name => counts[name] = 0);
  buildParticipantGrid();
});

const modal = document.getElementById("summaryModal");
const summaryList = document.getElementById("summaryList");
const copyBtn = document.getElementById("copySummary");
const closeBtn = document.getElementById("closeSummary");

document.getElementById("showSummary").addEventListener("click", () => {
  let text = "";
  let html = "";
  for (const [name, count] of Object.entries(counts)) {
    html += `<div><strong>${name}</strong>: ${count}</div>`;
    text += `${name}: ${count}\n`;
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
