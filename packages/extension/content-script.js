// Function to extract content from the page
function extractContent() {
  // Get the latest answer block
  const answerBlocks = document.querySelectorAll('div[id^="markdown-content-"]');
  const answerEl = answerBlocks[answerBlocks.length - 1];

  // Try to get the query from the input, or fallback to the last user message in the chat
  let raw_query = document.querySelector('textarea[placeholder*="Ask anything"]')?.value;

  if (!raw_query) {
    // Try to find the last user message in the chat (h1 with class group/query)
    const userMessages = document.querySelectorAll('h1.group\\/query');
    if (userMessages.length > 0) {
      raw_query = userMessages[userMessages.length - 1].innerText;
    }
  }

  const answer_markdown = answerEl?.innerText;

  if (!raw_query || !answer_markdown) {
    throw new Error('Could not find query or answer content on this page.');
  }

  return { raw_query, answer_markdown };
}

// Function to send content to background script
async function sendContent(data) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type: 'CLIP_CONTENT', data },
      response => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      }
    );
  });
}

// Main execution
(async () => {
  try {
    const content = extractContent();
    const result = await sendContent(content);
    
    if (result.success) {
      // Show success notification
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px;
        border-radius: 4px;
        z-index: 10000;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      `;
      notification.textContent = '✅ Successfully clipped content!';
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
    } else {
      throw new Error(result.error || 'Failed to send content');
    }
  } catch (err) {
    console.error('❌ Script error:', err);
    
    // Show error notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f44336;
      color: white;
      padding: 15px;
      border-radius: 4px;
      z-index: 10000;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;
    notification.textContent = `❌ Error: ${err.message}`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }
})(); 