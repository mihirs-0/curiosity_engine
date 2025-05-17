document.addEventListener('DOMContentLoaded', () => {
  const statusEl = document.getElementById('status');
  const clipButton = document.getElementById('clipButton');

  // Check if we're on a Perplexity page
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (!tab.url.includes('perplexity.ai')) {
      statusEl.textContent = 'Please visit a Perplexity page to use this extension';
      clipButton.disabled = true;
      return;
    }

    // Enable the clip button
    clipButton.addEventListener('click', async () => {
      try {
        statusEl.textContent = 'Clipping content...';
        clipButton.disabled = true;

        // Execute content script
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content-script.js']
        });

        // Wait a bit for the content script to complete
        setTimeout(() => {
          statusEl.textContent = 'Content clipped successfully!';
          clipButton.disabled = false;
        }, 1000);
      } catch (err) {
        console.error('Error:', err);
        statusEl.textContent = `Error: ${err.message}`;
        clipButton.disabled = false;
      }
    });
  });
}); 