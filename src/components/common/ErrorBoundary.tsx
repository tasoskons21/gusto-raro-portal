import { Component, ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: unknown) {
    console.error('UI Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="flex items-center justify-center h-64 p-6">
          <div className="text-center">
            <h3 className="text-slate-800 font-semibold text-base mb-1">Κάτι πήγε λάθος</h3>
            <p className="text-slate-500 text-sm">{this.state.error?.message || 'Προέκυψε σφάλμα κατά την εμφάνιση'}</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
