import { h, render, Component, VNode } from 'preact';
import { Suspense, useState, useEffect } from 'preact/compat';

// Custom ErrorBoundary component
class ErrorBoundary extends Component<{ fallback: (props: { error: Error }) => VNode }, { error: Error | null }> {
  constructor(props: { fallback: (props: { error: Error }) => VNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return this.props.fallback({ error: this.state.error });
    }
    return this.props.children;
  }
}

// Spinner component
const Spinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
    <div style={{ width: '30px', height: '30px', border: '3px solid #f3f3f3', borderTop: '3px solid #3498db', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

// Error component
const ErrorFallback = ({ error }: { error: Error }) => (
  <div style={{ padding: '20px', color: '#721c24', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '4px' }}>
    <h3>Something went wrong</h3>
    <p>{error.message}</p>
  </div>
);

// Query component that fetches data
const QueryDisplay = () => {
  const [query, setQuery] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Get the latest query ID from background script
    chrome.runtime.sendMessage({ type: 'GET_LATEST' }, async (latestQuery) => {
      if (!latestQuery) {
        setError(new Error('No query found'));
        return;
      }

      try {
        // Fetch the full query details
        const response = await fetch(`/queries/${latestQuery.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch query details');
        }
        const data = await response.json();
        setQuery(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      }
    });
  }, []);

  if (error) throw error;
  if (!query) return <Spinner />;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Latest Query</h2>
      <div style={{ marginTop: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '4px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>
          Query: {query.raw_query}
        </div>
        <div style={{ whiteSpace: 'pre-wrap' }}>
          Answer: {query.answer_markdown}
        </div>
      </div>
    </div>
  );
};

// Main App component
const App = () => (
  <ErrorBoundary fallback={ErrorFallback}>
    <Suspense fallback={<Spinner />}>
      <QueryDisplay />
    </Suspense>
  </ErrorBoundary>
);

// Render the app
render(<App />, document.body); 