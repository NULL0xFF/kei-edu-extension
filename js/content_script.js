/**
 * @file content_script.js
 * @description Injects scripts into the page and listens for messages from injected scripts
 */

/**
 * Function to load a JavaScript file dynamically
 * @param {string} url - The URL of the script to load
 * @returns {Promise} - The promise object representing the loading of the script
 */
function loadScript(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL(url);
        script.onload = resolve;
        script.onerror = reject;
        (document.head || document.documentElement).appendChild(script);
    });
}

// Inject scripts into the page
async function injectMainScript() {
    if (window.location.href.includes("cmmn/main.do")) {
        const script = 'js/dashboard.js';
        await loadScript(script)
            .then(() => console.debug(`Script ${script} loaded`))
            .catch(error => console.error(`Error loading ${script}:`, error));
    }
    const scripts = ['js/xlsx.full.min.js', 'js/shared.js', 'js/course.js', 'js/member.js', 'js/storage.js', 'js/solution.js'];
    scripts.forEach(script => {
        loadScript(script)
            .then(() => console.debug(`Script ${script} loaded`))
            .catch(error => console.error(`Error loading ${script}:`, error));
    });
}

injectMainScript();

// Listen for messages from injected scripts
window.addEventListener('message', (event) => {
    // We only accept messages from ourselves
    if (event.source != window) {
        return;
    }
    // Send message to background script
    if (event.data.type && (event.data.type === 'FROM_PAGE')) {
        chrome.runtime.sendMessage(event.data.message, (response) => {
            window.postMessage({ type: 'FROM_EXTENSION', response: response, messageId: event.data.messageId }, '*');
        });
    }
});