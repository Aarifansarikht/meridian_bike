import { Component } from 'react';

/**
 * Generic error boundary. Works both in the DOM tree and inside the R3F canvas
 * (e.g. to fall back to plain lights when the HDR fails).
 */
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    console.error(`[${this.props.name ?? 'ErrorBoundary'}]`, error);
    this.props.onError?.(error);
  }

  componentDidUpdate(prev) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      const { fallback } = this.props;
      return typeof fallback === 'function' ? fallback(this.state.error, this.reset) : (fallback ?? null);
    }
    return this.props.children;
  }
}
