// Content script for Perplexity AI
console.log('Content script loaded');

// Cache DOM selectors
const selectors = {
  main: 'main',
  query: 'h1',
  answer: '[data-testid="answer-content"]'
};

// Pre-compile selectors for better performance
const compiledSelectors = {
  main: document.querySelector(selectors.main),
  query: document.querySelector(selectors.query),
  answer: document.querySelector(selectors.answer)
};

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'clipContent') {
    try {
      // Use cached selectors first, fallback to live query if needed
      const mainContent = compiledSelectors.main || document.querySelector(selectors.main);
      if (!mainContent) {
        throw new Error('Could not find main content');
      }

      // Get the raw query (question) - use cached or live query
      const queryElement = compiledSelectors.query || document.querySelector(selectors.query);
      const rawQuery = queryElement?.textContent || '';

      // Get the answer content - use cached or live query
      const answerElement = compiledSelectors.answer || document.querySelector(selectors.answer);
      const answerMarkdown = answerElement?.textContent || '';

      // Send back the clipped content
      sendResponse({
        success: true,
        data: {
          raw_query: rawQuery,
          answer_markdown: answerMarkdown
        }
      });
    } catch (error: unknown) {
      console.error('Error clipping content:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
    return true; // Keep the message channel open for async response
  }
}); 