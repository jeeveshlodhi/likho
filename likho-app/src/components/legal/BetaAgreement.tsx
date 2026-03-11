import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  CheckCircle2, 
  Circle, 
  AlertTriangle, 
  Shield, 
  MessageSquare, 
  BarChart3,
  FileText,
  User,
  Mail,
  Lock,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { 
  acceptAgreement, 
  type BetaAgreementData,
  checkAgreementAccepted 
} from "@/lib/legal";

interface BetaAgreementProps {
  /** Optional className for styling */
  className?: string;
  /** Callback when agreement is successfully accepted */
  onAccept?: (data: BetaAgreementData) => void;
  /** Callback to view full terms */
  onViewTerms?: () => void;
  /** Callback to view privacy policy */
  onViewPrivacy?: () => void;
}

/**
 * Beta Agreement Component
 * 
 * Interactive agreement form for beta testers. Includes checkboxes for key terms,
 * user information collection, and local storage of agreement acceptance.
 */
export function BetaAgreement({ 
  className,
  onAccept,
  onViewTerms,
  onViewPrivacy
}: BetaAgreementProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    understandsBeta: false,
    agreesToFeedback: false,
    allowsAnalytics: false,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(() => checkAgreementAccepted());

  const toggleCheckbox = useCallback((field: keyof typeof formData) => {
    setFormData(prev => ({ ...prev, [field]: !prev[field] }));
    setError(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError("Please enter your full name");
      return;
    }
    
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!formData.understandsBeta) {
      setError("You must acknowledge that this is beta software");
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate a brief delay for UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const agreementData = acceptAgreement({
        name: formData.name.trim(),
        email: formData.email.trim(),
        understandsBeta: formData.understandsBeta,
        agreesToFeedback: formData.agreesToFeedback,
        allowsAnalytics: formData.allowsAnalytics,
      });

      setAccepted(true);
      onAccept?.(agreementData);
    } catch (err) {
      setError("Failed to save agreement. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, onAccept]);

  // If already accepted, show thank you state
  if (accepted) {
    return (
      <div className={cn(
        "max-w-md mx-auto px-6 py-12 text-center",
        className
      )}>
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-6">
          <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Welcome to the Beta!
        </h2>
        <p className="text-muted-foreground mb-6">
          Thank you for agreeing to participate. You&apos;re all set to start using Likho.
        </p>
        <div className="p-4 rounded-lg bg-surface text-sm text-muted-foreground">
          <p>
            Your beta agreement has been saved. You can start exploring the app now.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("max-w-lg mx-auto px-6 py-8", className)}>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 mb-4">
          <Sparkles className="w-8 h-8 text-amber-600 dark:text-amber-400" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground mb-2">
          Beta Program Agreement
        </h1>
        <p className="text-muted-foreground text-sm">
          Join the Likho beta and help shape the future of note-taking
        </p>
      </div>

      {/* Warning Banner */}
      <div className="mb-6 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            This is pre-release software. By participating, you acknowledge potential 
            bugs, data loss risks, and changing features.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            Your Information
          </h3>
          
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs">
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, name: e.target.value }));
                    setError(null);
                  }}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, email: e.target.value }));
                    setError(null);
                  }}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Agreement Checkboxes */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Terms & Conditions
          </h3>

          {/* Required: Beta Understanding */}
          <button
            onClick={() => toggleCheckbox("understandsBeta")}
            className={cn(
              "w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all",
              formData.understandsBeta
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 bg-background"
            )}
          >
            <div className="flex-shrink-0 mt-0.5">
              {formData.understandsBeta ? (
                <CheckCircle2 className="w-5 h-5 text-primary" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-medium text-foreground">
                  I understand this is beta software
                </span>
                <span className="text-xs text-red-500">*</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                I acknowledge that beta software may contain bugs, experience crashes, 
                and result in data loss. I agree to use it at my own risk.
              </p>
            </div>
          </button>

          {/* Optional: Feedback */}
          <button
            onClick={() => toggleCheckbox("agreesToFeedback")}
            className={cn(
              "w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all",
              formData.agreesToFeedback
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 bg-background"
            )}
          >
            <div className="flex-shrink-0 mt-0.5">
              {formData.agreesToFeedback ? (
                <CheckCircle2 className="w-5 h-5 text-primary" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-sm font-medium text-foreground">
                  I agree to provide feedback
                </span>
                <span className="text-xs text-muted-foreground">(optional)</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                I&apos;m willing to share feedback, report bugs, and suggest improvements 
                to help make Likho better.
              </p>
            </div>
          </button>

          {/* Optional: Analytics */}
          <button
            onClick={() => toggleCheckbox("allowsAnalytics")}
            className={cn(
              "w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all",
              formData.allowsAnalytics
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 bg-background"
            )}
          >
            <div className="flex-shrink-0 mt-0.5">
              {formData.allowsAnalytics ? (
                <CheckCircle2 className="w-5 h-5 text-primary" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-3.5 h-3.5 text-green-500" />
                <span className="text-sm font-medium text-foreground">
                  I allow anonymous analytics
                </span>
                <span className="text-xs text-muted-foreground">(optional)</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                I consent to the collection of anonymous usage data to help improve 
                the app. No personal content is included.
              </p>
            </div>
          </button>
        </div>

        {/* Legal Links */}
        <div className="flex items-center justify-center gap-4 text-xs">
          <button
            onClick={onViewTerms}
            className="text-primary hover:underline flex items-center gap-1"
          >
            <FileText className="w-3 h-3" />
            Terms of Service
          </button>
          <span className="text-muted-foreground">•</span>
          <button
            onClick={onViewPrivacy}
            className="text-primary hover:underline flex items-center gap-1"
          >
            <Shield className="w-3 h-3" />
            Privacy Policy
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-2">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Accept & Join Beta
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground mt-3">
            By clicking accept, you agree to the Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}

export default BetaAgreement;
