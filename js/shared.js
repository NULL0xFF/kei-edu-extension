/**
 * Tokenizes the given text by splitting it by comma and trimming each element.
 * @function tokenize
 * @param {string} text - The text to tokenize.
 * @returns {Array} - The tokenized array.
 */
function tokenize(text = '') {
    return text.replace(/\r/g, "").split(",").map(element => element.trim());
}

/**
 * Table the first and last entries of the given data.
 * @function customTable
 * @param {Array} data - The data to display.
 * @param {number} first - The number of entries to display from the start.
 * @param {number} last - The number of entries to display from the end.
 */
function customTable(data, first = 10, last = 10) {
    if (!Array.isArray(data)) {
        console.error('The data provided is not an array.');
        return;
    }

    const totalLength = data.length;
    if (totalLength <= first + last) {
        console.table(data.map((entry, index) => ({ index, ...entry })));
        return;
    }

    const firstEntries = data.slice(0, first).map((entry, index) => ({ index, ...entry }));
    const lastEntries = data.slice(-last).map((entry, index) => ({ index: totalLength - last + index, ...entry }));

    // Dynamically create a placeholder for the omitted entries
    const placeholder = { index: '...' };
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

/**
 * Get the current date and time in local ISO format
 * @param {Date} date - The date object to convert.
 * @returns {string} The date and time in local ISO format.
 */
function toLocalISOFormat(date) {
    const localISODate = date.toISOString().slice(0, 19); // Remove the 'Z' at the end
    const timezoneOffset = -date.getTimezoneOffset();
    const offsetSign = timezoneOffset >= 0 ? '+' : '-';
    const offsetHours = String(Math.floor(Math.abs(timezoneOffset) / 60)).padStart(2, '0');
    const offsetMinutes = String(Math.abs(timezoneOffset) % 60).padStart(2, '0');

    return `${localISODate}${offsetSign}${offsetHours}:${offsetMinutes}`;
}

/**
 * Convert a date string in UTC format to local ISO format
 * @param {string} dateString - The date string in yyyyMMddHHmmss format.
 * @returns {string} The date and time in local ISO format.
 */
function convertToLocalISOFormat(dateString) {
    if (dateString == null || dateString.length !== 14) {
        console.warn("Invalid date string:", dateString);
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

/**
 * Save data as JSON file
 * @param {string} fileName - The name of the file to save.
 * @param {Object} data - The data to save.
 * @returns {void}
 */
function saveAsJSON(fileName, data) {
    // console.log("saveAsJSON(" + fileName + ", ... ) called");
    var fileContent = JSON.stringify(data);
    var bb = new Blob([fileContent], { type: "text/plain" });
    var a = document.createElement("a");

    a.download = fileName + "_" + toLocalISOFormat(new Date()) + ".json";
    a.href = window.URL.createObjectURL(bb);
    a.click();
}