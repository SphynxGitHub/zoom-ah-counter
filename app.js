// === Zoom Ah-Counter with Participants ===

let counts = {};
let clickSound;

// Initialize Zoom SDK
ZoomAppsSdk.initialize()
  .then(async () => {
    console.log("✅ Zoom SDK initialized");

    clickSound = new Audio("sounds/pop.mp3");
    clickSound.preload = "auto";

    // Try to load participants
    try {
      const participants = await ZoomAppsSdk.getMeetingParticipants();
      if (participants && participants.length > 0) {
        buildParticipantGrid(participants);
      } else {
        showManualMode();
      }
    } catch (err) {
      console.warn("Could not fetch participants:", err);
      showManualMode();
    }
  })
  .catch(err => console.error("Zoom init failed:", err));

function buildParticipantGrid(participants) {
  const container = document.getElementById("participantContainer");
  container.innerHTML = ""; // clear "loading"

  participants.forEach(p => {
    const name = p.displayName || "Unknown";
    counts[name] = 0;

    const div = document.createElement("div");
    div.className = "word-card";
    div.innerHTML = `
      <div class="word">${name}</div>
      <div class="count" id="count-${name}">0</div>
    `;
    div.addEventListener("click", () => handleClick(name));
    container.appendChild(div);
  });
}

// Fallback: If not in Zoom, allow manual entry
function showManualMode() {
  const container = document.getElementById("participantContainer");
  container.innerHTML = "<div>No participants detected. Add manually below.</div>";
}

function handleClick(name) {
  clickSound.currentTime = 0;
  clickSound.play().catch(err => console.warn("Audio play error:", err));
  counts[name]++;
  document.getElementById(`count-${name}`).textContent = counts[name];
}

// Reset all counters
document.getElementById("resetAll").addEventListener("click", () => {
  Object.keys(counts).forEach(name => {
    counts[name] = 0;
    const el = document.getElementById(`count-${name}`);
    if (el) el.textContent = "0";
  });
});

// Add custom entry
document.getElementById("addCustom").addEventListener("click", () => {
  const name = prompt("Enter name or label:");
  if (!name || counts[name]) return; // skip duplicates or blank

  const container = document.getElementById("participantContainer");
  const div = document.createElement("div");
  div.className = "word-card";
  div.innerHTML = `
    <div class="word">${name}</div>
    <div class="count" id="count-${name}">0</div>
  `;
  div.addEventListener("click", () => handleClick(name));
  container.appendChild(div);
  counts[name] = 0;
});
