import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  Cookie, 
  X, 
  Shield, 
  BarChart3, 
  CheckCircle2,
  Settings
} from "lucide-react";
import { 
  setCookiePreferences, 
  getCookiePreferences, 
  checkCookieConsent,
  type CookiePreferences 
} from "@/lib/legal";

interface CookieConsentProps {
  /** Optional className for styling */
  className?: string;
  /** Callback when consent is given */
  onConsent?: (prefs: CookiePreferences) => void;
  /** Position of the banner */
  position?: "bottom" | "bottom-left" | "bottom-right";
}

/**
 * Cookie Consent Banner Component
 * 
 * GDPR-compliant cookie consent banner with granular controls.
 * Supports essential (always on) and analytics (opt-in) cookies.
 * Preferences are saved locally.
 */
export function CookieConsent({ 
  className,
  onConsent,
  position = "bottom"
}: CookieConsentProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    hasConsented: false,
  });

  // Check consent status on mount
  useEffect(() => {
    const hasConsented = checkCookieConsent();
    if (!hasConsented) {
      setIsVisible(true);
    } else {
      setPreferences(getCookiePreferences());
    }
  }, []);

  const handleAcceptAll = useCallback(() => {
    const newPrefs = setCookiePreferences({ 
      analytics: true 
    });
    setPreferences(newPrefs);
    setIsVisible(false);
    onConsent?.(newPrefs);
  }, [onConsent]);

  const handleAcceptEssential = useCallback(() => {
    const newPrefs = setCookiePreferences({ 
      analytics: false 
    });
    setPreferences(newPrefs);
    setIsVisible(false);
    onConsent?.(newPrefs);
  }, [onConsent]);

  const handleSavePreferences = useCallback(() => {
    const newPrefs = setCookiePreferences({ 
      analytics: preferences.analytics 
    });
    setPreferences(newPrefs);
    setIsVisible(false);
    onConsent?.(newPrefs);
  }, [preferences.analytics, onConsent]);

  const toggleAnalytics = useCallback(() => {
    setPreferences(prev => ({ ...prev, analytics: !prev.analytics }));
  }, []);

  // Don't render if consent already given and not showing details
  if (!isVisible && !showDetails) {
    return null;
  }

  // Position classes
  const positionClasses = {
    "bottom": "fixed bottom-0 left-0 right-0",
    "bottom-left": "fixed bottom-4 left-4 max-w-md",
    "bottom-right": "fixed bottom-4 right-4 max-w-md",
  };

  // If showing details (settings view)
  if (showDetails) {
    return (
      <div className={cn(
        "z-50 p-4 bg-background border border-border shadow-lg rounded-lg",
        position === "bottom" ? "fixed bottom-4 right-4 max-w-md" : positionClasses[position],
        className
      )}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10">
              <Settings className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Cookie Preferences</h3>
          </div>
          <button
            onClick={() => setShowDetails(false)}
            className="p-1 rounded-md hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-3 mb-4">
          {/* Essential Cookies - Always On */}
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="font-medium text-sm text-foreground">Essential</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/10 text-green-700 dark:text-green-400">
                  Required
                </span>
              </div>
              <Switch checked={true} disabled />
            </div>
            <p className="text-xs text-muted-foreground">
              These cookies are necessary for the website to function and cannot be 
              switched off. They include authentication and security cookies.
            </p>
          </div>

          {/* Analytics Cookies - Optional */}
          <div className={cn(
            "p-3 rounded-lg border transition-colors",
            preferences.analytics 
              ? "bg-primary/5 border-primary/30" 
              : "bg-background border-border"
          )}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-sm text-foreground">Analytics</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400">
                  Optional
                </span>
              </div>
              <Switch 
                checked={preferences.analytics} 
                onCheckedChange={toggleAnalytics}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              These cookies help us understand how visitors interact with our 
              website by collecting and reporting information anonymously. All data 
              is aggregated and cannot identify you personally.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSavePreferences}
            className="flex-1"
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            Save Preferences
          </Button>
        </div>
      </div>
    );
  }

  // Main banner view
  return (
    <div className={cn(
      "z-50 bg-background border-t border-border shadow-lg",
      positionClasses[position],
      position === "bottom" ? "p-4 sm:p-6" : "p-4 rounded-lg",
      className
    )}>
      <div className={cn(
        "mx-auto",
        position === "bottom" ? "max-w-6xl" : ""
      )}>
        <div className={cn(
          "flex flex-col gap-4",
          position === "bottom" ? "sm:flex-row sm:items-center sm:justify-between" : ""
        )}>
          {/* Content */}
          <div className="flex-1 flex items-start gap-3">
            <div className="hidden sm:flex p-2 rounded-lg bg-amber-500/10 flex-shrink-0">
              <Cookie className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2">
                <Cookie className="w-4 h-4 text-amber-600 dark:text-amber-400 sm:hidden" />
                We value your privacy
              </h3>
              <p className="text-sm text-muted-foreground">
                We use cookies to enhance your browsing experience, serve personalized 
                content, and analyze our traffic. Essential cookies are always enabled. 
                You can customize your preferences.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className={cn(
            "flex flex-col sm:flex-row gap-2 flex-shrink-0",
            position === "bottom" ? "sm:items-center" : ""
          )}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(true)}
              className="order-3 sm:order-1"
            >
              <Settings className="w-4 h-4 mr-1.5" />
              Customize
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleAcceptEssential}
              className="order-2"
            >
              Essential Only
            </Button>
            
            <Button
              size="sm"
              onClick={handleAcceptAll}
              className="order-1 sm:order-3"
            >
              Accept All
            </Button>

            {/* Close button for corner positions */}
            {position !== "bottom" && (
              <button
                onClick={() => setIsVisible(false)}
                className="absolute top-2 right-2 p-1 rounded-md hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface CookieSettingsButtonProps {
  /** Optional className for styling */
  className?: string;
  /** Callback when preferences are updated */
  onUpdate?: (prefs: CookiePreferences) => void;
}

/**
 * Button to reopen cookie settings
 * Can be placed in settings menu or footer
 */
export function CookieSettingsButton({ 
  className,
  onUpdate 
}: CookieSettingsButtonProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    hasConsented: false,
  });

  useEffect(() => {
    setPreferences(getCookiePreferences());
  }, [showSettings]);

  const handleSave = useCallback((analytics: boolean) => {
    const newPrefs = setCookiePreferences({ analytics });
    setPreferences(newPrefs);
    setShowSettings(false);
    onUpdate?.(newPrefs);
  }, [onUpdate]);

  return (
    <>
      <button
        onClick={() => setShowSettings(true)}
        className={cn(
          "inline-flex items-center gap-2 text-sm text-primary hover:underline",
          className
        )}
      >
        <Cookie className="w-4 h-4" />
        Cookie Settings
      </button>

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-background rounded-lg border border-border shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">
                Cookie Preferences
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 rounded-md hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {/* Essential */}
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-foreground">Essential</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-green-500/10 text-green-700">
                    Always On
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Required for the website to function properly.
                </p>
              </div>

              {/* Analytics */}
              <div className={cn(
                "p-4 rounded-lg border transition-colors",
                preferences.analytics 
                  ? "bg-primary/5 border-primary/30" 
                  : "bg-background border-border"
              )}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-foreground">Analytics</span>
                  </div>
                  <Switch 
                    checked={preferences.analytics}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({ ...prev, analytics: checked }))
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Helps us improve our website by collecting anonymous usage data.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowSettings(false)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1"
                onClick={() => handleSave(preferences.analytics)}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CookieConsent;
