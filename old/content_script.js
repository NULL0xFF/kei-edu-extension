var s = document.createElement('script');
var s2 = document.createElement('script');
var s3 = document.createElement('script');
s.src = chrome.runtime.getURL('script.js');
s2.src = chrome.runtime.getURL('script2.js');
s3.src = chrome.runtime.getURL('script3.js');
s.onload = function () {
    this.remove();
};
s2.onload = function () {
    this.remove();
};
s3.onload = function () {
    this.remove();
};
(document.head || document.documentElement).appendChild(s);
(document.head || document.documentElement).appendChild(s2);
(document.head || document.documentElement).appendChild(s3);