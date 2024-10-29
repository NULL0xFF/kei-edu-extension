// src/scripts/shared.js

// Utility function to tokenize text
export function tokenize(text = '') {
  return text.replace(/\r/g, '').split(',').map((element) => element.trim());
}

// Function to display a custom table in the console
export function customTable(data, first = 10, last = 10) {
  if (!Array.isArray(data)) {
    console.error('The data provided is not an array.');
    return;
  }

  const totalLength = data.length;
  if (totalLength <= first + last) {
    console.table(data.map((entry, index) => ({index, ...entry})));
    return;
  }

  const firstEntries = data.slice(0, first).map(
      (entry, index) => ({index, ...entry}));
  const lastEntries = data.slice(-last).map(
      (entry, index) => ({index: totalLength - last + index, ...entry}));

  // Dynamically create a placeholder for the omitted entries
  const placeholder = {index: '...'};
  if (firstEntries.length > 0) {
    for (const key of Object.keys(firstEntries[0])) {
      if (key !== 'index') {
        placeholder[key] = '...';
      }
    }
  }

  // Combine the first entries, placeholder, and last entries
  const combinedEntries = [...firstEntries, placeholder, ...lastEntries];

  console.table(combinedEntries);
}

// Function to get local ISO format of a date
export function toLocalISOFormat(date) {
  const localISODate = date.toISOString().slice(0, 19); // Remove the 'Z' at the end
  const timezoneOffset = -date.getTimezoneOffset();
  const offsetSign = timezoneOffset >= 0 ? '+' : '-';
  const offsetHours = String(
      Math.floor(Math.abs(timezoneOffset) / 60)).padStart(2, '0');
  const offsetMinutes = String(Math.abs(timezoneOffset) % 60).padStart(2, '0');

  return `${localISODate}${offsetSign}${offsetHours}:${offsetMinutes}`;
}

// Function to convert date string to local ISO format
export function convertToLocalISOFormat(dateString) {
  if (dateString == null || dateString.length !== 14) {
    console.warn('Invalid date string:', dateString);
    return null;
  }

  // Extract components from the input string
  const year = dateString.slice(0, 4);
  const month = dateString.slice(4, 6);
  const day = dateString.slice(6, 8);
  const hour = dateString.slice(8, 10);
  const minute = dateString.slice(10, 12);
  const second = dateString.slice(12, 14);
  // Create a new Date object (assume input is in UTC)
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));

  // Convert to local time ISO format using the extracted function
  return toLocalISOFormat(date);
}

// Function to save data as JSON file
export function saveAsJSON(fileName, data) {
  const fileContent = JSON.stringify(data);
  const blob = new Blob([fileContent], {type: 'application/json'});
  const a = document.createElement('a');

  a.download = `${fileName}_${toLocalISOFormat(new Date())}.json`;
  a.href = window.URL.createObjectURL(blob);
  a.click();
}
