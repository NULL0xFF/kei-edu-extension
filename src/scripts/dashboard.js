/**
 * Refresh the page every specified interval
 * @param {number} intervalInMinutes - The interval in minutes to refresh the page.
 * @returns {void}
 */
function refreshPage(intervalInMinutes) {
  console.log("Refresh page every", intervalInMinutes, "minute(s)...");

  // Refresh the page every specified interval
  setInterval(function () {
    location.reload();
  }, intervalInMinutes * 60 * 1000); // Convert minutes to milliseconds

  // Log the initial page load timestamp
  console.log("Page loaded at:", new Date().toLocaleString());
}

if (window.location.href.includes("cmmn/main.do")) {
  refreshPage(1);
}

