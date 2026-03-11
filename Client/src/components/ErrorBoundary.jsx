import { Component } from 'react';

/**
 * ErrorBoundary
 * Wraps the app (or any subtree) so a runtime crash in one component
 * doesn't take down the whole UI.
 *
 * Usage (in main.jsx or App.jsx):
 *   <ErrorBoundary>
 *     <App />
 *   </ErrorBoundary>
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Replace with your error monitoring service (Sentry, LogRocket, etc.)
    console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#EAF6F8',
          fontFamily: "'DM Sans', sans-serif",
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            maxWidth: 480,
            background: 'white',
            borderRadius: 20,
            padding: '40px 32px',
            boxShadow: '0 8px 32px rgba(30,77,92,0.12)',
            border: '1px solid rgba(203,231,227,0.5)',
          }}
        >
          <div style={{ fontSize: 56, marginBottom: 16 }}>⚠️</div>

          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: '#1e293b',
              marginBottom: 10,
            }}
          >
            Something went wrong
          </h1>

          <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, marginBottom: 28 }}>
            An unexpected error occurred. Our team has been notified.
            {import.meta.env.DEV && this.state.error && (
              <code
                style={{
                  display: 'block',
                  marginTop: 12,
                  padding: '10px 14px',
                  background: '#fef2f2',
                  borderRadius: 8,
                  fontSize: 12,
                  color: '#dc2626',
                  textAlign: 'left',
                  overflowX: 'auto',
                  wordBreak: 'break-all',
                }}
              >
                {this.state.error.message}
              </code>
            )}
          </p>

          <button
            onClick={this.handleReset}
            style={{
              padding: '12px 32px',
              borderRadius: 50,
              background: 'linear-gradient(135deg, #1e4d5c, #2D8A84)',
              color: 'white',
              fontWeight: 700,
              fontSize: 15,
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 4px 16px rgba(30,77,92,0.3)',
            }}
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
