document.addEventListener('DOMContentLoaded', function() {
  const clipButton = document.getElementById('clipButton');
  const openSidepanelButton = document.getElementById('openSidepanelButton');
  const statusText = document.getElementById('status');
  const statusIcon = document.getElementById('statusIcon');

  // Cache DOM elements and create document fragment for button content
  const buttonContent = {
    loading: document.createRange().createContextualFragment(`
      <svg class="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="16"></circle>
      </svg>
      Clipping...
    `),
    default: document.createRange().createContextualFragment(`
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
      </svg>
      Clip Current Page
    `)
  };

  function updateStatus(message, type = 'ready') {
    // Batch DOM updates
    requestAnimationFrame(() => {
      statusText.textContent = message;
      statusIcon.className = `status-icon ${type}`;
    });
  }

  function setLoading(isLoading) {
    // Batch DOM updates
    requestAnimationFrame(() => {
      clipButton.disabled = isLoading;
      clipButton.innerHTML = '';
      clipButton.appendChild(isLoading ? buttonContent.loading.cloneNode(true) : buttonContent.default.cloneNode(true));
    });
  }

  clipButton.addEventListener('click', async () => {
    try {
      setLoading(true);
      updateStatus('Clipping content...', 'ready');

      // Send message to content script
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'CLIP_CONTENT' });

      if (!response || !response.success) {
        throw new Error(response?.error || 'Failed to clip content');
      }

      // Validate the response data
      if (!response.data?.raw_query || !response.data?.answer_markdown) {
        throw new Error('Invalid content format');
      }

      // Send to backend API
      const apiResponse = await fetch('http://localhost:8000/queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(response.data)
      });

      if (!apiResponse.ok) {
        const error = await apiResponse.json();
        throw new Error(error.detail || 'API request failed');
      }

      const result = await apiResponse.json();
      
      // Check if the query was stored and processed successfully
      if (result.id && result.sonar_status) {
        updateStatus('Content clipped successfully!', 'ready');
        // Optionally show different status based on sonar_status
        if (result.sonar_status === 'error') {
          console.warn('Sonar processing failed:', result.sonar_data?.error);
        }
      } else {
        throw new Error('Invalid API response format');
      }

    } catch (error) {
      console.error('Error:', error);
      updateStatus(error.message || 'Failed to clip content', 'error');
    } finally {
      setLoading(false);
    }
  });

  openSidepanelButton.addEventListener('click', async () => {
    if (chrome.sidePanel) {
      await chrome.sidePanel.open({ windowId: chrome.windows.WINDOW_ID_CURRENT });
    } else {
      // Fallback for browsers that don't support side panel
      chrome.windows.create({
        url: 'sidepanel.html',
        type: 'popup',
        width: 400,
        height: 600
      });
    }
  });

  // Check if we're on a valid page
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    const currentUrl = tabs[0].url;
    if (!currentUrl.includes('perplexity.ai')) {
      clipButton.disabled = true;
      updateStatus('Please navigate to Perplexity AI', 'error');
    }
  });
}); 