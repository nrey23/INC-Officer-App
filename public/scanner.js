/**
 * QR Code Scanner Module
 * Handles QR code scanning functionality using the HTML5 QR Code library
 * Provides navigation functions for the scanner interface
 */

// Global variable to store the QR code scanner instance
let html5QrCode;

/**
 * Callback function for successful QR code scans
 * @param {string} decodedText - The text content of the scanned QR code
 * @param {Object} decodedResult - Additional scan result information
 */
function onScanSuccess(decodedText, decodedResult) {
  console.log("QR Code detected:", decodedText);
  // Display the decoded text in the result element
  document.getElementById("scanResult").textContent = decodedText;

  // Optionally, if you wish to stop scanning after a successful read, you can uncomment the next line:
  // html5QrCode.stop();
}

/**
 * Callback function for failed QR code scan attempts
 * @param {Error} error - The error that occurred during scanning
 */
function onScanFailure(error) {
  console.warn("Scanning error:", error);
}

// Initialize the QR scanner when the DOM content is fully loaded
window.addEventListener("DOMContentLoaded", () => {
  // Create a new QR code scanner instance
  html5QrCode = new Html5Qrcode("qr-reader");
  
  // Configure scanner settings
  const config = { fps: 10 }; // No qrbox so the video fills the container
  
  // Start the scanner using the device's back camera
  html5QrCode.start(
    { facingMode: "environment" }, // Use the back camera
    config,
    onScanSuccess,
    onScanFailure
  ).catch(err => {
    console.error("Unable to start QR scanner:", err);
  });
});

/**
 * Navigation function to return to the dashboard
 */
function goBack() {
  window.location.href = "dashboard.html";
}

/**
 * Logout function - clears login state and redirects to login page
 */
function logout() {
  localStorage.removeItem("isLoggedIn");
  window.location.href = "login.html";
}
