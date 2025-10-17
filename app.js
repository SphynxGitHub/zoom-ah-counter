// Initialize Zoom Apps SDK
ZoomAppsSdk.initialize()
  .then(() => console.log("✅ Zoom Apps SDK initialized"))
  .catch((err) => console.error("Zoom SDK init failed", err));

// Define words you want to track
const words = ["Ah", "Um", "Like", "You know", "So", "Actually"];

// State
let counts = {};
words.forEach(w => counts[w] = 0);

// Load sound
const clickSound = new Audio("sounds/pop.mp3");
clickSound.preload = "auto";

// Build UI
const container = document.getElementById("buttonsContainer");
words.forEach(word => {
  const div = document.createElement("div");
  div.className = "word-card";
  div.innerHTML = `
    <div class="word">${word}</div>
    <div class="count" id="count-${word}">0</div>
  `;
  div.addEventListener("click", () => handleClick(word));
  container.appendChild(div);
});

function handleClick(word) {
  clickSound.currentTime = 0;
  clickSound.play().catch(err => console.warn("Audio play error:", err));
  counts[word]++;
  document.getElementById(`count-${word}`).textContent = counts[word];
}

document.getElementById("resetAll").addEventListener("click", () => {
  Object.keys(counts).forEach(w => {
    counts[w] = 0;
    document.getElementById(`count-${w}`).textContent = "0";
  });
});
