// Content script for Perplexity AI
console.log('Content script loaded');
// Cache DOM selectors
var selectors = {
    main: 'main',
    query: 'h1',
    answer: '[data-testid="answer-content"]'
};
// Pre-compile selectors for better performance
var compiledSelectors = {
    main: document.querySelector(selectors.main),
    query: document.querySelector(selectors.query),
    answer: document.querySelector(selectors.answer)
};
// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'clipContent') {
        try {
            // Use cached selectors first, fallback to live query if needed
            var mainContent = compiledSelectors.main || document.querySelector(selectors.main);
            if (!mainContent) {
                throw new Error('Could not find main content');
            }
            // Get the raw query (question) - use cached or live query
            var queryElement = compiledSelectors.query || document.querySelector(selectors.query);
            var rawQuery = (queryElement === null || queryElement === void 0 ? void 0 : queryElement.textContent) || '';
            // Get the answer content - use cached or live query
            var answerElement = compiledSelectors.answer || document.querySelector(selectors.answer);
            var answerMarkdown = (answerElement === null || answerElement === void 0 ? void 0 : answerElement.textContent) || '';
            // Send back the clipped content
            sendResponse({
                success: true,
                data: {
                    raw_query: rawQuery,
                    answer_markdown: answerMarkdown
                }
            });
        }
        catch (error) {
            console.error('Error clipping content:', error);
            sendResponse({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            });
        }
        return true; // Keep the message channel open for async response
    }
});
