import React from 'react';
import Button from '../Button/Button';

class AdminPageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  componentDidCatch(error, info) {
    console.error('Admin page crashed:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex-center flex-col" style={{ minHeight: '60vh', gap: '16px' }}>
          <p style={{ color: 'var(--color-danger)', fontSize: '1.15rem', fontWeight: 700 }}>
            This admin page hit a runtime error.
          </p>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: 680, textAlign: 'center' }}>
            {this.state.error.message || 'Something went wrong while rendering this page.'}
          </p>
          <Button variant="outline" onClick={() => this.setState({ error: null })}>
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AdminPageErrorBoundary;
