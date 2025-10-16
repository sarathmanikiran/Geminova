import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Icons } from './Icons';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  // Fix: Removed 'public' modifier as it's the default and can cause issues with some tooling.
  state: State = {
    hasError: false
  };

  // Fix: Removed 'public' modifier.
  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  // Fix: Removed 'public' modifier.
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  // Fix: Removed 'public' modifier.
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen flex flex-col justify-center items-center bg-background p-4 text-center">
          <Icons.Error className="w-16 h-16 text-error mb-4" />
          <h1 className="text-2xl font-display font-bold text-primary-text mb-2">Something went wrong.</h1>
          <p className="text-secondary-text mb-6">
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-accent text-white font-semibold rounded-lg hover:bg-accent-hover transition-colors"
          >
            Refresh
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
