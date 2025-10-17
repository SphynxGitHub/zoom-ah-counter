let counts = {};
let clickSound;

console.log("App started: initializing ZoomAppsSdk...");

// Initialize only once
ZoomAppsSdk.initialize()
  .then(async () => {
    console.log("✅ ZoomAppsSdk initialized successfully!");

    // Preload sound
    clickSound = new Audio("sounds/click.mp3");
    clickSound.preload = "auto";

    // Check current context
    const context = await ZoomAppsSdk.getContext();
    console.log("📋 Current context:", context);

    // Ensure we're actually in a meeting
    if (context.runningContext !== "inMeeting") {
      console.warn("⚠️ Not detected as in-meeting. Showing manual mode.");
      showManualMode();
      return;
    }

    // Try to fetch participants
    try {
      console.log("Fetching participants...");
      const participants = await ZoomAppsSdk.getMeetingParticipants();
      console.log("Participants data:", participants);

      if (participants && participants.length > 0) {
        buildParticipantGrid(participants);
      } else {
        console.warn("No participants returned — using fallback to self.");
        const name = context.user?.displayName || "You";
        buildParticipantGrid([{ displayName: name }]);
      }
    } catch (err) {
      console.error("❌ Error getting participants:", err);
      showManualMode();
    }
  })
  .catch(err => console.error("❌ ZoomAppsSdk initialization failed:", err));

function buildParticipantGrid(participants) {
  const container = document.getElementById("participantContainer");
  container.innerHTML = "";

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

// Reset all
document.getElementById("resetAll").addEventListener("click", () => {
  Object.keys(counts).forEach(name => {
    counts[name] = 0;
    const el = document.getElementById(`count-${name}`);
    if (el) el.textContent = "0";
  });
});

// Add custom
document.getElementById("addCustom").addEventListener("click", () => {
  const name = prompt("Enter name or label:");
  if (!name || counts[name]) return;
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

// === Summary modal ===
const modal = document.getElementById("summaryModal");
const summaryList = document.getElementById("summaryList");
const copyBtn = document.getElementById("copySummary");
const closeBtn = document.getElementById("closeSummary");

document.getElementById("showSummary").addEventListener("click", () => {
  let total = "";
  let html = "";

  for (const [name, count] of Object.entries(counts)) {
    html += `<div><strong>${name}</strong>: ${count}</div>`;
    total += `${name}: ${count}\n`;
  }

  summaryList.innerHTML = html || "<em>No counts yet.</em>";
  modal.classList.remove("hidden");

  // Enable copy
  copyBtn.onclick = () => {
    navigator.clipboard.writeText(total.trim());
    copyBtn.textContent = "Copied!";
    setTimeout(() => (copyBtn.textContent = "Copy"), 1500);
  };
});

// Close modal
closeBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
});
