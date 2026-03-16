/**
 * Error tracking service for catching and reporting errors
 */
import { api } from './api';
import {
  ErrorLogCreateRequest,
  ErrorType,
} from '@/types/feedback';

// App version
const APP_VERSION = import.meta.env.VITE_APP_VERSION || '0.1.0';

// Store original error handlers
let originalOnError: typeof window.onerror | null = null;
let originalOnUnhandledRejection: typeof window.onunhandledrejection | null = null;

// Error queue for batching
interface QueuedError {
  data: ErrorLogCreateRequest;
  retryCount: number;
}
const errorQueue: QueuedError[] = [];
let flushTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Get the current platform
 */
function getPlatform(): string {
  if (typeof window !== 'undefined' && (window as unknown as { __TAURI__?: unknown }).__TAURI__) {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('mac')) return 'macos';
    if (userAgent.includes('win')) return 'windows';
    if (userAgent.includes('linux')) return 'linux';
    return 'desktop';
  }
  return 'web';
}

/**
 * Extract component name from React error info if available
 */
function extractComponentName(errorInfo?: { componentStack?: string }): string | undefined {
  if (!errorInfo?.componentStack) return undefined;
  
  // Extract component name from React component stack
  const match = errorInfo.componentStack.match(/in\s+(\w+)/);
  return match?.[1];
}

/**
 * Sanitize error message to remove sensitive data
 */
function sanitizeErrorMessage(message: string): string {
  // Remove potential sensitive information
  return message
    .replace(/[a-f0-9]{32,}/gi, '[REDACTED_HASH]') // API keys, tokens
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[REDACTED_EMAIL]') // Emails
    .replace(/password[=:]\S+/gi, 'password=[REDACTED]') // Passwords
    .substring(0, 2000); // Limit length
}

/**
 * Sanitize stack trace to remove sensitive data
 */
function sanitizeStackTrace(stackTrace?: string): string | undefined {
  if (!stackTrace) return undefined;
  
  // Remove file paths and URLs that might contain sensitive info
  return stackTrace
    .replace(/file:\/\/\/[^\s]*/g, '[LOCAL_FILE]')
    .replace(/https?:\/\/[^\s"]*/g, '[URL]')
    .substring(0, 10000); // Limit length
}

/**
 * Send error to backend
 */
async function sendError(data: ErrorLogCreateRequest): Promise<void> {
  try {
    await api.post('/errors', data, {
      headers: {
        'X-Platform': getPlatform(),
        'X-App-Version': APP_VERSION,
      },
      // Short timeout to avoid blocking the app
      timeout: 5000,
    });
  } catch (error) {
    // Silently fail - error tracking should never crash the app
    console.warn('Failed to send error report:', error);
    throw error;
  }
}

/**
 * Flush the error queue
 */
async function flushErrorQueue(): Promise<void> {
  if (errorQueue.length === 0) return;
  
  const errorsToSend = [...errorQueue];
  errorQueue.length = 0; // Clear queue
  
  for (const queuedError of errorsToSend) {
    try {
      await sendError(queuedError.data);
    } catch {
      // Re-queue if retry count allows
      if (queuedError.retryCount < 3) {
        errorQueue.push({
          ...queuedError,
          retryCount: queuedError.retryCount + 1,
        });
      }
    }
  }
  
  // Schedule another flush if there are still errors
  if (errorQueue.length > 0) {
    flushTimeout = setTimeout(flushErrorQueue, 30000); // Retry in 30 seconds
  }
}

/**
 * Queue an error for sending
 */
function queueError(data: ErrorLogCreateRequest): void {
  errorQueue.push({ data, retryCount: 0 });
  
  // Schedule flush
  if (!flushTimeout) {
    flushTimeout = setTimeout(() => {
      flushTimeout = null;
      flushErrorQueue();
    }, 1000); // Batch errors for 1 second
  }
}

/**
 * Report an error manually
 */
export function reportError(
  error: Error | string,
  options: {
    type?: ErrorType;
    component?: string;
    action?: string;
    metadata?: Record<string, unknown>;
  } = {}
): void {
  const message = typeof error === 'string' ? error : error.message;
  const stackTrace = typeof error === 'string' ? undefined : error.stack;
  
  const data: ErrorLogCreateRequest = {
    error_type: options.type || 'exception',
    message: sanitizeErrorMessage(message),
    stack_trace: sanitizeStackTrace(stackTrace),
    component: options.component,
    action: options.action,
    metadata: {
      url: window.location.href,
      timestamp: new Date().toISOString(),
      ...options.metadata,
    },
  };
  
  queueError(data);
}

/**
 * Report a React component error (for Error Boundary)
 */
export function reportComponentError(
  error: Error,
  errorInfo: { componentStack?: string },
  componentName?: string
): void {
  reportError(error, {
    type: 'exception',
    component: componentName || extractComponentName(errorInfo),
    metadata: {
      componentStack: errorInfo.componentStack?.substring(0, 1000),
    },
  });
}

/**
 * Report a network error
 */
export function reportNetworkError(
  error: Error,
  requestInfo?: { url?: string; method?: string }
): void {
  reportError(error, {
    type: 'network',
    action: requestInfo ? `${requestInfo.method} ${requestInfo.url}` : undefined,
  });
}

/**
 * Report a sync error
 */
export function reportSyncError(
  error: Error,
  operation?: string
): void {
  reportError(error, {
    type: 'sync',
    action: operation,
  });
}

/**
 * Global error handler
 */
function handleGlobalError(
  message: string | Event,
  source?: string,
  lineno?: number,
  colno?: number,
  error?: Error
): boolean {
  // Call original handler if exists
  if (originalOnError) {
    originalOnError(message, source, lineno, colno, error);
  }
  
  // Don't report non-error messages
  if (typeof message === 'object') {
    return false;
  }
  
  const errorMessage = typeof message === 'string' ? message : 'Unknown error';
  
  reportError(errorMessage, {
    type: 'exception',
    metadata: {
      source,
      line: lineno,
      column: colno,
      stack: error?.stack?.substring(0, 1000),
    },
  });
  
  // Return false to allow default browser handling
  return false;
}

/**
 * Global unhandled promise rejection handler
 */
function handleUnhandledRejection(event: PromiseRejectionEvent): void {
  // Call original handler if exists
  if (originalOnUnhandledRejection) {
    originalOnUnhandledRejection.call(window, event);
  }
  
  const reason = event.reason;
  
  if (reason instanceof Error) {
    reportError(reason, {
      type: 'exception',
      action: 'unhandled_promise_rejection',
    });
  } else {
    reportError(String(reason), {
      type: 'exception',
      action: 'unhandled_promise_rejection',
    });
  }
}

/**
 * Initialize global error tracking
 */
export function initErrorTracking(): () => void {
  // Store original handlers
  originalOnError = window.onerror;
  originalOnUnhandledRejection = window.onunhandledrejection;
  
  // Set up global handlers
  window.onerror = handleGlobalError;
  window.onunhandledrejection = handleUnhandledRejection;
  
  // Return cleanup function
  return () => {
    window.onerror = originalOnError;
    window.onunhandledrejection = originalOnUnhandledRejection;
    
    // Flush any remaining errors
    if (errorQueue.length > 0) {
      flushErrorQueue();
    }
  };
}

/**
 * Manually flush all pending errors
 * Call this before app shutdown if possible
 */
export async function flushPendingErrors(): Promise<void> {
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }
  await flushErrorQueue();
}

/**
 * Check if error tracking is available
 */
export function isErrorTrackingAvailable(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Get error stats (for debugging)
 */
export function getErrorTrackingStats(): {
  queueSize: number;
  isAvailable: boolean;
} {
  return {
    queueSize: errorQueue.length,
    isAvailable: isErrorTrackingAvailable(),
  };
}
