// Function to refresh the page every specified interval
function refreshPage(intervalInMinutes) {
    console.log("Refresh page every", intervalInMinutes, "minute(s)...");

    // Refresh the page every specified interval
    setInterval(function () {
        location.reload();
    }, intervalInMinutes * 60 * 1000); // Convert minutes to milliseconds

    // Log the initial page load timestamp
    console.log("Page loaded at:", new Date().toLocaleString());
}

// Expose the refreshPage function globally
window.refreshPage = refreshPage;