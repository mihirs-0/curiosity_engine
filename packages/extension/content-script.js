// Function to extract content from the page
function extractContent() {
  const answerEl = document.querySelector('[data-testid="result-text"]');
  if (!answerEl) {
    throw new Error('No answer content found on page');
  }

  let raw_query = document.querySelector('textarea[placeholder*="Ask anything"]')?.value;

  if (!raw_query) {
    const userMessages = document.querySelectorAll('h1.group\\/query');
    if (userMessages.length > 0) {
      raw_query = userMessages[userMessages.length - 1].innerText;
    }
  }

  if (!raw_query) {
    throw new Error('No query found on page');
  }

  const answer_markdown = answerEl.innerText;
  if (!answer_markdown) {
    throw new Error('No answer content found');
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
          console.error("Error sending message:", chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      }
    );
  });
}

// Function to show notifications
function showNotification(message, isSuccess = true) {
  // Remove any existing notifications
  const existingNotification = document.querySelector('.curiosity-notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  const notification = document.createElement('div');
  notification.className = 'curiosity-notification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 16px;
    border-radius: 8px;
    background: ${isSuccess ? '#10b981' : '#ef4444'};
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    z-index: 10000;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    display: flex;
    align-items: center;
    gap: 8px;
    opacity: 0;
    transform: translateY(-10px);
    transition: all 0.2s ease;
  `;

  // Add icon based on status
  const icon = document.createElement('span');
  icon.innerHTML = isSuccess 
    ? '✓'
    : '✕';
  icon.style.cssText = `
    font-size: 16px;
    font-weight: bold;
  `;

  notification.appendChild(icon);
  notification.appendChild(document.createTextNode(message));
  document.body.appendChild(notification);

  // Animate in
  setTimeout(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateY(0)';
  }, 10);

  // Remove after delay
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-10px)';
    setTimeout(() => notification.remove(), 200);
  }, 3000);
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'clipContent') {
    try {
      const content = extractContent();
      sendResponse({ success: true, data: content });
      showNotification('Content clipped successfully!');
    } catch (error) {
      console.error('Error extracting content:', error);
      sendResponse({ success: false, error: error.message });
      showNotification(error.message, false);
    }
  }
  return true; // Keep the message channel open for async response
});

// Add styles for notifications
const style = document.createElement('style');
style.textContent = `
  .curiosity-notification {
    animation: slideIn 0.2s ease-out;
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(style);

async function processNode(node) {
  console.log("Processing node:", node);
  let targetElement = null;
  if (node.matches && node.matches('[data-testid="result-text"]')) {
    targetElement = node;
    console.log("Found direct match for result-text");
  } else if (node.querySelector) {
    targetElement = node.querySelector('[data-testid="result-text"]');
    console.log("Found result-text via querySelector:", targetElement);
  }

  if (targetElement) {
    console.log("Perplexity answer element found:", targetElement);
    const content = extractContent();
    console.log("Extracted content:", content);
    if (content) {
      try {
        const result = await sendContent(content);
        console.log("Send content result:", result);
        if (result && result.success) {
          showNotification('✅ Successfully clipped content!', true);
        } else {
          showNotification(`❌ Error: ${result?.error || 'Failed to send content'}`, false);
        }
      } catch (err) {
        console.error('❌ Script error during sendContent:', err);
        showNotification(`❌ Error: ${err.message}`, false);
      }
    } else {
      console.log("Content not extracted from node:", targetElement);
    }
  }
}

// MutationObserver setup
const observer = new MutationObserver((mutationsList, observer) => {
  for (const mutation of mutationsList) {
    if (mutation.type === 'childList') {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Check if the added node itself or its children contain the target
          processNode(node);
        }
      }
    } else if (mutation.type === 'attributes' && mutation.target.matches && mutation.target.matches('[data-testid="result-text"]')) {
        // Sometimes content might be loaded into an existing element, changing attributes or innerHTML
        // This handles cases where the element itself is modified
        processNode(mutation.target);
    }
  }
});

// Start observing the document body for added nodes and attribute changes.
// Adjust the target and config as necessary for Perplexity's structure.
// It's often better to observe a more specific container if known.
const targetNode = document.body; 
const config = { childList: true, subtree: true, attributes: true, attributeFilter: ['data-testid', 'class'] }; // Added attributeFilter for more specific observation

// Initial check in case content is already there
// We need to find the container of all results.
// Let's assume perplexity might have a main content area.
// This initial scan is a bit broad, might need refinement based on actual Perplexity structure.
document.querySelectorAll('[data-testid="result-text"]').forEach(processNode);


console.log("Perplexity content script loaded. MutationObserver starting.");
observer.observe(targetNode, config);

// The original main execution block is now handled by the MutationObserver.
// The following is commented out as it runs only once.
/*
(async () => {
  try {
    const content = extractContent(); // This would need to be adapted if it's to be kept
    const result = await sendContent(content);
    
    if (result.success) {
      showNotification('✅ Successfully clipped content!', true);
    } else {
      throw new Error(result.error || 'Failed to send content');
    }
  } catch (err) {
    console.error('❌ Script error:', err);
    showNotification(`❌ Error: ${err.message}`, false);
  }
})(); 
*/ 