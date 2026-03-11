import { useCallback, useEffect, useRef } from "react";
import { trackEvent, isFeedbackOptedIn } from "@/lib/feedback";

export interface AnalyticsOptions {
  enabled?: boolean;
  debounceMs?: number;
}

/**
 * Hook for tracking analytics events
 */
export function useAnalytics(options: AnalyticsOptions = {}) {
  const { enabled = true, debounceMs = 1000 } = options;
  const pendingEvents = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const sessionStart = useRef<number>(Date.now());

  /**
   * Track an event with optional debouncing
   */
  const track = useCallback(
    async (eventName: string, properties?: Record<string, unknown>, debounceKey?: string) => {
      if (!enabled) return;

      // Check if user opted in
      const optedIn = await isFeedbackOptedIn();
      if (!optedIn) return;

      const eventData = {
        ...properties,
        session_duration_ms: Date.now() - sessionStart.current,
      };

      // If debounce key is provided, debounce the event
      if (debounceKey) {
        const key = `${eventName}:${debounceKey}`;
        
        // Clear existing timeout for this key
        if (pendingEvents.current.has(key)) {
          clearTimeout(pendingEvents.current.get(key)!);
        }

        // Set new timeout
        const timeout = setTimeout(() => {
          trackEvent(eventName, eventData);
          pendingEvents.current.delete(key);
        }, debounceMs);

        pendingEvents.current.set(key, timeout);
      } else {
        // Track immediately
        await trackEvent(eventName, eventData);
      }
    },
    [enabled, debounceMs]
  );

  /**
   * Track a page/feature view
   */
  const trackView = useCallback(
    async (viewName: string, properties?: Record<string, unknown>) => {
      await track("view", { view_name: viewName, ...properties });
    },
    [track]
  );

  /**
   * Track a user action
   */
  const trackAction = useCallback(
    async (actionName: string, properties?: Record<string, unknown>) => {
      await track("action", { action_name: actionName, ...properties });
    },
    [track]
  );

  /**
   * Track feature usage
   */
  const trackFeature = useCallback(
    async (featureName: string, properties?: Record<string, unknown>) => {
      await track("feature_used", { feature_name: featureName, ...properties });
    },
    [track]
  );

  /**
   * Track error
   */
  const trackError = useCallback(
    async (errorType: string, errorMessage: string, properties?: Record<string, unknown>) => {
      await track("error", {
        error_type: errorType,
        error_message: errorMessage,
        ...properties,
      });
    },
    [track]
  );

  /**
   * Track performance metric
   */
  const trackPerformance = useCallback(
    async (metricName: string, durationMs: number, properties?: Record<string, unknown>) => {
      await track("performance", {
        metric_name: metricName,
        duration_ms: durationMs,
        ...properties,
      });
    },
    [track]
  );

  // Cleanup pending events on unmount
  useEffect(() => {
    return () => {
      pendingEvents.current.forEach((timeout) => clearTimeout(timeout));
      pendingEvents.current.clear();
    };
  }, []);

  return {
    track,
    trackView,
    trackAction,
    trackFeature,
    trackError,
    trackPerformance,
  };
}

/**
 * Hook to track when a component mounts/unmounts
 */
export function useTrackView(viewName: string, properties?: Record<string, unknown>) {
  const { trackView } = useAnalytics();

  useEffect(() => {
    trackView(viewName, properties);
  }, []); // Only track on mount
}

/**
 * Hook to track feature usage with timing
 */
export function useTrackFeature(featureName: string) {
  const { trackFeature, trackPerformance } = useAnalytics();
  const startTime = useRef<number>(Date.now());

  useEffect(() => {
    startTime.current = Date.now();
    trackFeature(`${featureName}_started`);

    return () => {
      const duration = Date.now() - startTime.current;
      trackFeature(`${featureName}_completed`, { duration_ms: duration });
    };
  }, []);

  return {
    trackFeature: (action: string, props?: Record<string, unknown>) =>
      trackFeature(`${featureName}_${action}`, props),
  };
}

export default useAnalytics;
