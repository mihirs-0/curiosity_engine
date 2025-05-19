// Background script for Curiosity Engine extension
chrome.runtime.onInstalled.addListener(function () {
    console.log('Curiosity Engine extension installed');
});
// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.type === 'LATEST_CLIPPED_QUERY') {
        // Store the latest query in chrome.storage
        chrome.storage.local.set({ latestClippedQuery: message.data });
    }
    return true;
});
