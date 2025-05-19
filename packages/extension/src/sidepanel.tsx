/// <reference types="chrome"/>
import { h, render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import type { JSX } from 'preact';

// Declare Chrome types
declare global {
  interface Window {
    chrome: typeof chrome;
  }
}

interface ClippedQuery {
  raw_query: string;
  answer_markdown: string;
}

function SidePanel(): JSX.Element {
  const [latestQuery, setLatestQuery] = useState<ClippedQuery | null>(null);
  useEffect(() => {
    window.chrome.storage.local.get(['latestClippedQuery'], (result) => {
      if (result.latestClippedQuery) {
        setLatestQuery(result.latestClippedQuery);
      }
    });

    // Listen for updates from background/content script
    const listener = (msg: { type: string; data: ClippedQuery }) => {
      if (msg.type === 'LATEST_CLIPPED_QUERY') {
        setLatestQuery(msg.data);
      }
    };
    window.chrome.runtime.onMessage.addListener(listener);
    return () => window.chrome.runtime.onMessage.removeListener(listener);
  }, []);

  return (
    <div style={{ padding: 16, fontFamily: 'sans-serif' }}>
      <h2>Curiosity Engine Side Panel</h2>
      <p>Welcome! This is your side panel.</p>
      {latestQuery ? (
        <div style={{ marginTop: 16 }}>
          <h3>Latest Clipped Query:</h3>
          <div><strong>Query:</strong> {latestQuery.raw_query}</div>
          <div style={{ marginTop: 8 }}><strong>Answer:</strong><br />
            <pre style={{ whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: 8, borderRadius: 4 }}>{latestQuery.answer_markdown}</pre>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 16, color: '#888' }}>No query clipped yet.</div>
      )}
    </div>
  );
}

render(<SidePanel />, document.getElementById('app')!); 