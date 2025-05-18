// Function to extract content from the page
function extractContent(targetNode) {
  // The targetNode is expected to be the element matching '[data-testid="result-text"]'
  // or a relevant parent if the selector needs to be more specific.
  const answerEl = targetNode.querySelector('[data-testid="result-text"]') || targetNode; // Adjust if targetNode itself is the result-text

  let raw_query = document.querySelector('textarea[placeholder*="Ask anything"]')?.value;

  if (!raw_query) {
    const userMessages = document.querySelectorAll('h1.group\\/query');
    if (userMessages.length > 0) {
      raw_query = userMessages[userMessages.length - 1].innerText;
    }
  }

  const answer_markdown = answerEl?.innerText;

  if (!raw_query || !answer_markdown) {
    // console.warn('Could not find query or answer content with the new selector.');
    return null; // Return null instead of throwing an error immediately
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

function showNotification(message, isSuccess) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${isSuccess ? '#4CAF50' : '#f44336'};
    color: white;
    padding: 15px;
    border-radius: 4px;
    z-index: 10000;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    font-family: sans-serif;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

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
    const content = extractContent(targetElement);
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