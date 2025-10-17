// Initialize Zoom Apps SDK
ZoomAppsSdk.initialize()
  .then(() => {
    console.log("✅ Zoom Apps SDK initialized");
  })
  .catch((err) => {
    console.error("Zoom SDK init failed", err);
  });

// Sound setup
const clickSound = new Audio("sounds/click.mp3");
clickSound.preload = "auto";

// Counter logic
let count = 0;
const counterEl = document.getElementById("counter");
const clickBtn = document.getElementById("clickBtn");
const undoBtn = document.getElementById("undoBtn");
const resetBtn = document.getElementById("resetBtn");

function playClick() {
  clickSound.currentTime = 0;
  clickSound.play().catch((err) => console.warn("Audio play error", err));
}

function updateCounter() {
  counterEl.textContent = count;
}

clickBtn.addEventListener("click", () => {
  playClick();
  count++;
  updateCounter();
});

undoBtn.addEventListener("click", () => {
  if (count > 0) {
    count--;
    updateCounter();
  }
});

resetBtn.addEventListener("click", () => {
  count = 0;
  updateCounter();
});
