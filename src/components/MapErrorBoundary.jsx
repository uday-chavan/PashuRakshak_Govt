import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class MapErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('MapErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            height: this.props.height || 440,
            background: '#0f172a',
            color: '#f8fafc',
            borderRadius: 12,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            textAlign: 'center',
          }}
        >
          <AlertTriangle size={36} color="#ef4444" style={{ marginBottom: 12 }} />
          <h3 style={{ margin: '0 0 8px 0', fontSize: 16 }}>Map Display Notice</h3>
          <p style={{ margin: '0 0 16px 0', fontSize: 13, color: '#94a3b8', maxWidth: 400 }}>
            An unexpected error occurred while initializing the map view. Click below to reload.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: '#10b981',
              color: '#ffffff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
