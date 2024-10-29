// src/background.js
import browser from 'webextension-polyfill';

// Define the scripts to inject based on URL patterns
const scriptsToInject = [
  {
    matches: ['http://cyber-admin.kei.re.kr/*cmmn/main.do*'],
    files: ['scripts/dashboard.js'],
  },
  {
    matches: ['http://cyber-admin.kei.re.kr/*user/member/memberList.do*'],
    files: ['scripts/solution.js'],
  },
  {
    matches: ['http://cyber-admin.kei.re.kr/*'],
    files: [
      'scripts/shared.js',
      'scripts/course.js',
      'scripts/member.js',
      'scripts/storage.js',
    ],
  },
];

// Listener for tab updates to inject scripts
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    for (const script of scriptsToInject) {
      if (script.matches.some(
          (pattern) => tab.url.includes(pattern.replace('*', '')))) {
        try {
          await browser.scripting.executeScript({
            target: {tabId},
            files: script.files,
          });
        } catch (error) {
          console.error('Error injecting scripts:', error);
        }
      }
    }
  }
});
