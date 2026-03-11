import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Bug,
  Lightbulb,
  Heart,
  MessageSquare,
  Send,
  Loader2,
  Check,
  Camera,
  AlertCircle,
} from "lucide-react";
import { submitFeedback, captureScreenshot, FeedbackType, FeedbackData } from "@/lib/feedback";

interface FeedbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const feedbackTypes: { type: FeedbackType; label: string; icon: React.ElementType; color: string }[] = [
  { type: "bug", label: "Bug Report", icon: Bug, color: "text-red-600 bg-red-50" },
  { type: "feature", label: "Feature Request", icon: Lightbulb, color: "text-amber-600 bg-amber-50" },
  { type: "praise", label: "Praise", icon: Heart, color: "text-pink-600 bg-pink-50" },
  { type: "other", label: "Other", icon: MessageSquare, color: "text-zinc-600 bg-zinc-50" },
];

export function FeedbackDialog({ isOpen, onClose }: FeedbackDialogProps) {
  const [type, setType] = useState<FeedbackType | null>(null);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [includeScreenshot, setIncludeScreenshot] = useState(true);
  const [screenshotData, setScreenshotData] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      // Reset state
      setType(null);
      setMessage("");
      setEmail("");
      setIncludeScreenshot(true);
      setScreenshotData(null);
      setIsSuccess(false);
      setError(null);
      onClose();
    }
  }, [isSubmitting, onClose]);

  const handleCaptureScreenshot = async () => {
    setIsCapturing(true);
    try {
      const screenshot = await captureScreenshot();
      setScreenshotData(screenshot);
    } catch (err) {
      console.error("Failed to capture screenshot:", err);
      setIncludeScreenshot(false);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleSubmit = async () => {
    if (!type || !message.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const feedbackData: FeedbackData = {
        type,
        message: message.trim(),
        email: email.trim() || undefined,
        includeScreenshot,
        screenshotData: includeScreenshot ? screenshotData || undefined : undefined,
      };

      const result = await submitFeedback(feedbackData);

      if (result.success) {
        setIsSuccess(true);
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        setError(result.error || "Failed to submit feedback");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-100">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">Send Feedback</h2>
                <p className="text-sm text-zinc-500 mt-0.5">
                  Help us improve Likho
                </p>
              </div>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="p-2 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 
                           transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {isSuccess ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="p-4 bg-green-50 rounded-full"
                  >
                    <Check className="w-10 h-10 text-green-600" />
                  </motion.div>
                  <h3 className="mt-4 font-semibold text-zinc-900">Thank you!</h3>
                  <p className="text-sm text-zinc-500 text-center mt-1">
                    Your feedback helps us make Likho better.
                  </p>
                </div>
              ) : (
                <>
                  {/* Feedback Type Selection */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-zinc-700">
                      What type of feedback is this? *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {feedbackTypes.map((ft) => (
                        <button
                          key={ft.type}
                          onClick={() => setType(ft.type)}
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all
                            ${type === ft.type 
                              ? "border-blue-600 bg-blue-50" 
                              : "border-zinc-100 hover:border-zinc-200 bg-white"
                            }`}
                        >
                          <div className={`p-2 rounded-lg ${ft.color}`}>
                            <ft.icon className="w-4 h-4" />
                          </div>
                          <span className={`text-sm font-medium ${
                            type === ft.type ? "text-blue-900" : "text-zinc-700"
                          }`}>
                            {ft.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message Input */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-zinc-700">
                      Tell us more *
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={
                        type === "bug"
                          ? "Describe the bug and steps to reproduce..."
                          : type === "feature"
                          ? "Describe the feature you'd like to see..."
                          : "Share your thoughts..."
                      }
                      rows={4}
                      className="w-full px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 
                                 bg-zinc-50 border border-zinc-200 rounded-xl 
                                 focus:outline-none focus:ring-2 focus:ring-blue-500/20 
                                 focus:border-blue-500 resize-none"
                    />
                  </div>

                  {/* Screenshot Option */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeScreenshot}
                        onChange={(e) => {
                          setIncludeScreenshot(e.target.checked);
                          if (e.target.checked && !screenshotData) {
                            handleCaptureScreenshot();
                          }
                        }}
                        className="w-4 h-4 text-blue-600 border-zinc-300 rounded 
                                   focus:ring-blue-500"
                      />
                      <span className="text-sm text-zinc-700">
                        Include screenshot
                      </span>
                      {isCapturing && (
                        <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                      )}
                    </label>

                    {includeScreenshot && screenshotData && (
                      <div className="relative rounded-lg overflow-hidden border border-zinc-200">
                        <img
                          src={screenshotData}
                          alt="Screenshot preview"
                          className="w-full h-32 object-cover object-top"
                        />
                        <button
                          onClick={() => setScreenshotData(null)}
                          className="absolute top-2 right-2 p-1 bg-black/50 text-white 
                                     rounded-md hover:bg-black/70 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {includeScreenshot && !screenshotData && !isCapturing && (
                      <button
                        onClick={handleCaptureScreenshot}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-600 
                                   bg-zinc-50 border border-zinc-200 rounded-lg 
                                   hover:bg-zinc-100 transition-colors"
                      >
                        <Camera className="w-4 h-4" />
                        Capture Screenshot
                      </button>
                    )}
                  </div>

                  {/* Email Input */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-zinc-700">
                      Email (optional)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 
                                 bg-zinc-50 border border-zinc-200 rounded-xl 
                                 focus:outline-none focus:ring-2 focus:ring-blue-500/20 
                                 focus:border-blue-500"
                    />
                    <p className="text-xs text-zinc-500">
                      We may contact you for more details about your feedback.
                    </p>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {!isSuccess && (
              <div className="flex items-center justify-end gap-3 p-6 pt-0">
                <button
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 
                             transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!type || !message.trim() || isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white 
                             bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors 
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Feedback
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default FeedbackDialog;
