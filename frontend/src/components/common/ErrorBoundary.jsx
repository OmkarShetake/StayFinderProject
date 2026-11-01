import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled Application Error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '80vh',
            padding: '24px',
            textAlign: 'center',
            fontFamily: 'var(--font, sans-serif)',
          }}
        >
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>🏚️</div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>
            Something went wrong
          </h2>
          <p style={{ color: 'var(--text-2, #717171)', maxWidth: '420px', marginBottom: '24px', lineHeight: 1.5 }}>
            An unexpected error occurred while loading this page. Please try refreshing or return to the homepage.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={this.handleReload}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                background: 'var(--red, #FF385C)',
                color: 'white',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reload Page
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={this.handleGoHome}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                background: 'transparent',
                border: '1px solid var(--border, #DDD)',
                color: 'inherit',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Go to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
