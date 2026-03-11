import { Component, ReactNode, ErrorInfo } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, MessageSquare, Home } from "lucide-react";
import { submitErrorReport } from "@/lib/feedback";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReportError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isReporting: boolean;
  reportSent: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    isReporting: false,
    reportSent: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error, 
      errorInfo: null,
      isReporting: false,
      reportSent: false,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    
    this.setState({ errorInfo });

    // Auto-submit error report in the background
    submitErrorReport(error, {
      componentStack: errorInfo.componentStack,
      url: window.location.href,
      userAgent: navigator.userAgent,
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  private handleReportError = async () => {
    const { error, errorInfo } = this.state;
    if (!error) return;

    this.setState({ isReporting: true });

    try {
      await submitErrorReport(error, {
        componentStack: errorInfo?.componentStack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        manuallyReported: true,
      });

      this.setState({ reportSent: true });
    } catch (e) {
      console.error("Failed to report error:", e);
    } finally {
      this.setState({ isReporting: false });
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-zinc-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-50 rounded-xl">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-zinc-900">
                    Something went wrong
                  </h1>
                  <p className="text-sm text-zinc-500 mt-1">
                    We apologize for the inconvenience
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Error Message */}
              <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                <p className="text-sm font-medium text-red-900">
                  {this.state.error?.name || "Error"}
                </p>
                <p className="text-sm text-red-700 mt-1">
                  {this.state.error?.message || "An unexpected error occurred"}
                </p>
              </div>

              {/* Error Details (collapsed by default) */}
              {this.state.errorInfo && (
                <details className="group">
                  <summary className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer hover:text-zinc-900">
                    <span className="group-open:rotate-90 transition-transform">▶</span>
                    Technical details
                  </summary>
                  <pre className="mt-3 p-3 bg-zinc-900 text-zinc-100 text-xs rounded-lg overflow-auto max-h-40">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              {/* Report Status */}
              {this.state.reportSent && (
                <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg">
                  ✓ Error report sent. Thank you for helping us improve!
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-6 pt-0 space-y-3">
              <button
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 
                           text-sm font-medium text-white bg-zinc-900 rounded-xl 
                           hover:bg-zinc-800 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Application
              </button>

              <div className="flex gap-3">
                <button
                  onClick={this.handleGoHome}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 
                             text-sm font-medium text-zinc-700 bg-zinc-100 rounded-xl 
                             hover:bg-zinc-200 transition-colors"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </button>
                <button
                  onClick={this.handleReportError}
                  disabled={this.state.isReporting || this.state.reportSent}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 
                             text-sm font-medium text-zinc-700 bg-zinc-100 rounded-xl 
                             hover:bg-zinc-200 transition-colors disabled:opacity-50"
                >
                  {this.state.isReporting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <MessageSquare className="w-4 h-4" />
                  )}
                  {this.state.reportSent ? "Reported" : "Report"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
