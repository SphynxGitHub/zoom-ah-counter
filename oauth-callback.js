const DEEPLINK =
  "https://marketplace.zoom.us/zoomapp/vt8JWGG5SBmzU2gidUgi5A/context/panel/target/launch/deeplink";

async function openViaSDK() {
  try {
    await zoomSdk.config({ capabilities: ["openUrl"] });
    await zoomSdk.openUrl({
      url: DEEPLINK,
      context: "inClient"
    });
    return true;
  } catch (e) {
    return false;
  }
}

function openViaDeepLink() {
  window.location.href = DEEPLINK;
}

async function init() {
  let insideZoom = false;

  try {
    await zoomSdk.ready();
    insideZoom = true;
  } catch {}

  if (insideZoom) {
    await openViaSDK();
  } else {
    setTimeout(() => openViaDeepLink(), 400);

    setTimeout(() => {
      document.getElementById("fallback").style.display = "block";
    }, 3000);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("openButton")
    .addEventListener("click", openViaDeepLink);
});

init();
