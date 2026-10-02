import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('3D Viewport / WebGL ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-fallback">
          <div className="error-card glass-panel">
            <div className="error-icon-wrap">
              <AlertTriangle size={36} className="text-warning" />
            </div>
            <h3>{this.props.fallbackTitle || 'WebGL Rendering Error'}</h3>
            <p className="error-desc">
              {this.state.error?.message ||
                'A WebGL context or rendering pipeline issue occurred while processing the 3D scene.'}
            </p>
            <button className="btn-primary" onClick={this.handleReset}>
              <RefreshCw size={16} />
              <span>Reset 3D Canvas</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
