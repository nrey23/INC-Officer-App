let html5QrCode;

// Called when a QR code is successfully scanned.
function onScanSuccess(decodedText, decodedResult) {
  console.log("QR Code detected:", decodedText);
  // Simply display the decoded text.
  document.getElementById("scanResult").textContent = decodedText;

  // Optionally, if you wish to stop scanning after a successful read, you can uncomment the next line:
  // html5QrCode.stop();
}

// Called when a scan attempt fails (optional).
function onScanFailure(error) {
  console.warn("Scanning error:", error);
}

// Initialize the QR scanner when the DOM content is fully loaded.
window.addEventListener("DOMContentLoaded", () => {
  html5QrCode = new Html5Qrcode("qr-reader");
  const config = { fps: 10 }; // No qrbox so the video fills the container.
  html5QrCode.start(
    { facingMode: "environment" },
    config,
    onScanSuccess,
    onScanFailure
  ).catch(err => {
    console.error("Unable to start QR scanner:", err);
  });
});

// Navigation functions.
function goBack() {
  window.location.href = "dashboard.html";
}

function logout() {
  localStorage.removeItem("isLoggedIn");
  window.location.href = "login.html";
}
