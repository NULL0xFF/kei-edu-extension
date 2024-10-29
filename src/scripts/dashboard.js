// src/scripts/dashboard.js

// Function to refresh the page at a specified interval
function refreshPage(intervalInMinutes) {
  console.log('Refresh page every', intervalInMinutes, 'minute(s)...');

  // Refresh the page every specified interval
  setInterval(function () {
    location.reload();
  }, intervalInMinutes * 60 * 1000); // Convert minutes to milliseconds

  // Log the initial page load timestamp
  console.log('Page loaded at:', new Date().toLocaleString());
}

// Start the page refresh with the desired interval
refreshPage(1);
