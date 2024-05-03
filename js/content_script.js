var scriptElement = document.createElement('script');
scriptElement.src = chrome.runtime.getURL('js/kei_admin.js');
scriptElement.onload = function () { this.remove(); };
(document.head || document.documentElement).appendChild(scriptElement);