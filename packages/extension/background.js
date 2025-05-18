// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Curiosity Engine Clipper installed');
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'CLIP_CONTENT') {
    // Handle the clipped content
    console.log('Received clipped content:', request.data);
    
    // Store the latest clipped query
    chrome.storage.local.set({ latestClippedQuery: request.data }, () => {
      // Notify side panel (if open)
      chrome.runtime.sendMessage({ type: 'LATEST_CLIPPED_QUERY', data: request.data });
    });
    
    // Send to backend
    fetch('http://localhost:8004/queries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request.data)
    })
    .then(response => response.json())
    .then(data => {
      console.log('Success:', data);
      sendResponse({ success: true, data });
    })
    .catch(error => {
      console.error('Error:', error);
      sendResponse({ success: false, error: error.message });
    });
    
    return true; // Will respond asynchronously
  }
}); 