let counts = {};
let clickSound;
let participantRefreshInterval;
let debugBox;

// === Utility for on-screen logs ===
function log(msg) {
  if (!debugBox) {
    debugBox = document.createElement("div");
    debugBox.style.position = "fixed";
    debugBox.style.bottom = "8px";
    debugBox.style.right = "8px";
    debugBox.style.background = "rgba(0,0,0,0.6)";
    debugBox.style.color = "#fff";
    debugBox.style.fontSize = "12px";
    debugBox.style.padding = "6px 10px";
    debugBox.style.borderRadius = "8px";
    debugBox.style.maxWidth = "300px";
    debugBox.style.zIndex = "9999";
    document.body.appendChild(debugBox);
  }
  const line = document.createElement("div");
  line.textContent = msg;
  debugBox.appendChild(line);
  console.log(msg);
}

// === Initialize Zoom App SDK ===
log("Initializing ZoomAppsSdk...");

ZoomAppsSdk.initialize()
  .then(async () => {
    log("✅ ZoomAppsSdk initialized successfully");

    // Prepare click sound
    clickSound = new Audio("sounds/click.mp3");
    clickSound.preload = "auto";

    // Try to get context
    const context = await ZoomAppsSdk.getContext();
    log("📋 Context: " + JSON.stringify(context));

    if (context.runningContext !== "inMeeting") {
      log("⚠️ Not detected as in-meeting. Showing manual mode.");
      showManualMode();
      return;
    }

    // Initial participant fetch
    await refreshParticipants();

    // Auto-refresh every 10 seconds
    participantRefreshInterval = setInterval(refreshParticipants, 10000);
  })
  .catch(err => {
    log("❌ ZoomAppsSdk initialization failed: " + err);
  });

// === Fetch and build participants ===
async function refreshParticipants() {
  try {
    log("🔄 Fetching participants...");
    const participants = await ZoomAppsSdk.getMeetingParticipants();
    if (participants && participants.length > 0) {
      log(`✅ Got ${participants.length} participant(s).`);
      buildParticipantGrid(participants);
    } else {
      log("⚠️ No participants returned, showing fallback.");
      const context = await ZoomAppsSdk.getContext();
      const name = context.user?.displayName || "You";
      buildParticipantGrid([{ displayName: name }]);
    }
  } catch (err) {
    log("❌ Error fetching participants: " + err);
    showManualMode();
  }
}

// === UI Builders ===
function buildParticipantGrid(participants) {
  const container = document.getElementById("participantContainer");
  container.innerHTML = "";

  participants.forEach(p => {
    const name = p.displayName || "Unknown";
    if (!counts[name]) counts[name] = 0;

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

function showManualMode() {
  const container = document.getElementById("participantContainer");
  container.innerHTML =
    "<div>No participants detected. Add manually below.</div>";
}

// === Button Handlers ===
function handleClick(name) {
  clickSound.currentTime = 0;
  clickSound.play().catch(err => log("Audio play error: " + err));
  counts[name]++;
  document.getElementById(`count-${name}`).textContent = counts[name];
}

document.getElementById("resetAll").addEventListener("click", () => {
  Object.keys(counts).forEach(name => {
    counts[name] = 0;
    const el = document.getElementById(`count-${name}`);
    if (el) el.textContent = "0";
  });
});

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

// === Summary Modal ===
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

  copyBtn.onclick = () => {
    navigator.clipboard.writeText(total.trim());
    copyBtn.textContent = "Copied!";
    setTimeout(() => (copyBtn.textContent = "Copy"), 1500);
  };
});

closeBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
});
