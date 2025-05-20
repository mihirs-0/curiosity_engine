// Content script for Perplexity AI
console.log('[CE] content listener installed', chrome?.runtime?.id);
chrome.runtime.onMessage.addListener((_,__,sendR)=>{
  console.log('[CE] got message'); sendR('pong'); return true;
});

console.log('[Curiosity Engine] Content script loaded');

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
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log('[Curiosity Engine] Received message:', request);
    
    if (request.type === 'CLIP_CONTENT') {
        try {
            console.log('[Curiosity Engine] Processing CLIP_CONTENT request');
            
            // Use cached selectors first, fallback to live query if needed
            const mainContent = compiledSelectors.main || document.querySelector(selectors.main);
            if (!mainContent) {
                console.error('[Curiosity Engine] Could not find main content');
                throw new Error('Could not find main content');
            }
            
            // Get the raw query (question) - use cached or live query
            const queryElement = compiledSelectors.query || document.querySelector(selectors.query);
            const rawQuery = queryElement?.textContent || '';
            console.log('[Curiosity Engine] Found query:', rawQuery);
            
            // Get the answer content - use cached or live query
            const answerElement = compiledSelectors.answer || document.querySelector(selectors.answer);
            const answerMarkdown = answerElement?.textContent || '';
            console.log('[Curiosity Engine] Found answer:', answerMarkdown);
            
            // Send back the clipped content
            const response = {
                success: true,
                data: {
                    raw_query: rawQuery,
                    answer_markdown: answerMarkdown
                }
            };
            console.log('[Curiosity Engine] Sending response:', response);
            sendResponse(response);
        }
        catch (error) {
            console.error('[Curiosity Engine] Error clipping content:', error);
            const response = {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
            sendResponse(response);
        }
        return true; // Keep the message channel open for async response
    }
});
