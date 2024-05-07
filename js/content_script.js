// Function to load a JavaScript file dynamically
function loadScript(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = resolve;
        script.onerror = reject;
        (document.head || document.documentElement).appendChild(script);
    });
}

// Load shared.js first
loadScript(chrome.runtime.getURL('js/shared.js'))
    .then(() => {
        console.log("Shared script loaded");

        // Determine which page we're on and load the appropriate JavaScript file
        if (window.location.href.includes("user/member/memberList.do")) {
            return loadScript(chrome.runtime.getURL('js/member.js'))
                .then(() => console.log("Member script loaded"))
                .catch(error => console.error("Error loading member.js:", error));
        } else if (window.location.href.includes("cmmn/main.do")) {
            return loadScript(chrome.runtime.getURL('js/dashboard.js'))
                .then(() => console.log("Dashboard script loaded"))
                .catch(error => console.error("Error loading dashboard.js:", error));
        }
    })
    .catch(error => console.error("Error loading shared.js:", error));
