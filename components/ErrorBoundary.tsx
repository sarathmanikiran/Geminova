import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Icons } from './Icons';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  // Fix: Replaced the constructor with a class property for state initialization.
  // This resolves typing errors where `this.state` and `this.props` were not
  // being recognized on the component instance.
  state: State = { hasError: false };

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen flex flex-col justify-center items-center bg-black p-4 text-center">
          <Icons.Error className="w-16 h-16 text-red-400 mb-4" />
          <h1 className="text-2xl font-display font-bold text-white mb-2">Something went wrong.</h1>
          <p className="text-gray-400 mb-6">
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-all transform hover:scale-105 active-scale-95"
          >
            Refresh
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
