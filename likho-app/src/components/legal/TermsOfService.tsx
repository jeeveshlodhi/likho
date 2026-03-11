import { cn } from "@/lib/utils";
import { 
  FileText, 
  AlertTriangle, 
  Lock, 
  MessageSquare, 
  XCircle, 
  ShieldAlert,
  Calendar,
  CheckCircle,
  Scale
} from "lucide-react";

interface TermsOfServiceProps {
  /** Optional className for styling */
  className?: string;
  /** Effective date - defaults to current date if not provided */
  effectiveDate?: string;
  /** Beta version number */
  betaVersion?: string;
}

/**
 * Terms of Service Component
 * 
 * Beta-specific terms of service for the Likho application.
 * Includes disclaimers, data loss warnings, confidentiality, and liability limitations.
 */
export function TermsOfService({ 
  className,
  effectiveDate = "March 11, 2026",
  betaVersion = "0.1.0"
}: TermsOfServiceProps) {
  return (
    <div className={cn("max-w-4xl mx-auto px-6 py-12", className)}>
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 mb-6">
          <FileText className="w-8 h-8 text-amber-600 dark:text-amber-400" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">
          Terms of Service
        </h1>
        <p className="text-lg text-amber-600 dark:text-amber-400 font-medium mb-2">
          Beta Software Agreement
        </p>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          These terms govern your use of Likho during the beta testing period. 
          Please read carefully before using the application.
        </p>
        <div className="flex items-center justify-center gap-4 mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>Effective: {effectiveDate}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4" />
            <span>Version: {betaVersion}</span>
          </div>
        </div>
      </div>

      {/* Beta Warning Banner */}
      <div className="mb-10 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-800 dark:text-amber-300 mb-1">
              Beta Software Notice
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Likho is currently in beta. This means the software may contain bugs, 
              experience downtime, and undergo significant changes. By using this 
              application, you acknowledge and accept these risks.
            </p>
          </div>
        </div>
      </div>

      {/* Table of Contents */}
      <div className="bg-surface rounded-lg p-6 mb-10">
        <h2 className="text-lg font-semibold mb-4">Contents</h2>
        <nav className="grid gap-2 sm:grid-cols-2">
          {[
            { id: "acceptance", label: "Acceptance of Terms" },
            { id: "beta-nature", label: "Beta Software Disclaimer" },
            { id: "data-loss", label: "Data Loss Risk" },
            { id: "confidentiality", label: "Confidentiality" },
            { id: "feedback", label: "Feedback License" },
            { id: "termination", label: "Termination" },
            { id: "liability", label: "Limitation of Liability" },
            { id: "changes", label: "Changes to Terms" },
          ].map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="text-sm text-muted-foreground hover:text-primary transition-colors py-1"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>

      {/* Section 1: Acceptance */}
      <section id="acceptance" className="mb-12 scroll-mt-20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <CheckCircle className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground">
            1. Acceptance of Terms
          </h2>
        </div>

        <div className="space-y-4 text-muted-foreground">
          <p>
            By accessing or using Likho (&ldquo;the Service&rdquo;), you agree to be bound 
            by these Terms of Service. If you do not agree to these terms, you must 
            not use the Service.
          </p>
          
          <div className="p-4 rounded-lg border border-border bg-background">
            <h4 className="font-medium text-foreground mb-2">Eligibility</h4>
            <p className="text-sm">
              You must be at least 18 years old to use Likho. By using the Service, 
              you represent and warrant that you meet this requirement and have the 
              legal capacity to enter into these terms.
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: Beta Software Disclaimer */}
      <section id="beta-nature" className="mb-12 scroll-mt-20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground">
            2. Beta Software Disclaimer
          </h2>
        </div>

        <div className="space-y-4 text-muted-foreground">
          <p>
            You acknowledge and agree that:
          </p>

          <ul className="space-y-3">
            {[
              "Likho is a pre-release beta product that is still under development",
              "The Service may contain bugs, errors, defects, and other problems",
              "Features may be incomplete, change significantly, or be removed without notice",
              "The Service may be unavailable or experience downtime for maintenance",
              "Data loss or corruption may occur due to software defects",
              "Performance may be slower or less reliable than the final release",
            ].map((item, index) => (
              <li key={index} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium flex items-center justify-center">
                  {index + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-800 dark:text-amber-300">
              <strong>AS-IS Basis:</strong> The Service is provided on an &ldquo;AS IS&rdquo; 
              and &ldquo;AS AVAILABLE&rdquo; basis without warranties of any kind, either 
              express or implied.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Data Loss Risk */}
      <section id="data-loss" className="mb-12 scroll-mt-20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-red-500/10">
            <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground">
            3. Data Loss Risk Acknowledgment
          </h2>
        </div>

        <div className="space-y-4 text-muted-foreground">
          <p>
            By using Likho during the beta period, you explicitly acknowledge and 
            accept the following risks regarding your data:
          </p>

          <div className="grid gap-4">
            <div className="p-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
              <h4 className="font-medium text-red-800 dark:text-red-300 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Data Loss Risk
              </h4>
              <p className="text-sm text-red-700 dark:text-red-400">
                Beta software may contain defects that could result in partial or 
                complete data loss. We strongly recommend maintaining backup copies 
                of any important data stored in Likho.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-border bg-background">
              <h4 className="font-medium text-foreground mb-2">
                Your Responsibilities
              </h4>
              <ul className="text-sm space-y-2 list-disc list-inside">
                <li>Regularly export and backup your important notes and data</li>
                <li>Do not store mission-critical or legally sensitive information</li>
                <li>Verify the integrity of exported data</li>
                <li>Understand that we cannot guarantee data recovery in case of loss</li>
              </ul>
            </div>
          </div>

          <p className="text-sm">
            While we implement backup systems and data protection measures, you 
            acknowledge that data loss may still occur and that you use the Service 
            at your own risk regarding data preservation.
          </p>
        </div>
      </section>

      {/* Section 4: Confidentiality */}
      <section id="confidentiality" className="mb-12 scroll-mt-20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground">
            4. Confidentiality Requirements
          </h2>
        </div>

        <div className="space-y-4 text-muted-foreground">
          <p>
            As a beta tester, you may have access to features, functionality, or 
            information that is not yet publicly available. You agree to:
          </p>

          <div className="space-y-3">
            {[
              {
                title: "Non-Disclosure",
                desc: "Keep all confidential information about unreleased features, product roadmap, and beta discussions strictly confidential."
              },
              {
                title: "No Reverse Engineering",
                desc: "Not attempt to decompile, reverse engineer, or create derivative works from the beta software."
              },
              {
                title: "Screenshots & Sharing",
                desc: "Obtain written permission before sharing screenshots, videos, or detailed descriptions of the beta product publicly."
              },
              {
                title: "Feedback Confidentiality",
                desc: "Understand that feedback you provide may be used to improve the product without compensation or attribution."
              }
            ].map((item, index) => (
              <div 
                key={index}
                className="flex gap-3 p-3 rounded-lg bg-surface"
              >
                <Lock className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-medium text-foreground text-sm">{item.title}</h4>
                  <p className="text-xs mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-sm text-blue-700 dark:text-blue-400">
              <strong>Exception:</strong> You may discuss your general experience 
              with Likho and recommend it to others, provided you do not reveal 
              specific unreleased features or confidential details.
            </p>
          </div>
        </div>
      </section>

      {/* Section 5: Feedback License */}
      <section id="feedback" className="mb-12 scroll-mt-20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground">
            5. Feedback License
          </h2>
        </div>

        <div className="space-y-4 text-muted-foreground">
          <p>
            We encourage and appreciate your feedback during the beta period. 
            By providing feedback, suggestions, or ideas:
          </p>

          <ul className="space-y-2 list-disc list-inside">
            <li>
              You grant us a perpetual, irrevocable, worldwide, royalty-free license 
              to use, modify, and incorporate your feedback into our products
            </li>
            <li>
              You waive any moral rights or claims to attribution for your feedback
            </li>
            <li>
              You understand that we may use your feedback without compensation
            </li>
            <li>
              You represent that your feedback does not violate any third-party rights
            </li>
          </ul>

          <div className="p-4 rounded-lg border border-border bg-background">
            <h4 className="font-medium text-foreground mb-2">How to Provide Feedback</h4>
            <p className="text-sm">
              Use the in-app feedback button or email us at{" "}
              <a href="mailto:beta@likho.app" className="text-primary hover:underline">
                beta@likho.app
              </a>. 
              Detailed bug reports with steps to reproduce are especially valuable.
            </p>
          </div>
        </div>
      </section>

      {/* Section 6: Termination */}
      <section id="termination" className="mb-12 scroll-mt-20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-red-500/10">
            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground">
            6. Termination
          </h2>
        </div>

        <div className="space-y-4 text-muted-foreground">
          <p>
            Either party may terminate this agreement at any time:
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="p-4 rounded-lg border border-border bg-background">
              <h4 className="font-medium text-foreground mb-2">By You</h4>
              <p className="text-sm">
                You may stop using Likho and delete your account at any time. 
                Please export your data before deletion, as it may not be recoverable.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-border bg-background">
              <h4 className="font-medium text-foreground mb-2">By Us</h4>
              <p className="text-sm">
                We may suspend or terminate your access to the beta program at any 
                time, with or without cause, and with or without notice.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-muted">
            <p className="text-sm">
              <strong>Effect of Termination:</strong> Upon termination, your right 
              to use the Service immediately ceases. We may delete your data in 
              accordance with our data retention policies. Sections regarding 
              confidentiality, feedback license, and liability limitations shall 
              survive termination.
            </p>
          </div>
        </div>
      </section>

      {/* Section 7: Limitation of Liability */}
      <section id="liability" className="mb-12 scroll-mt-20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Scale className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground">
            7. Limitation of Liability
          </h2>
        </div>

        <div className="space-y-4 text-muted-foreground">
          <p>
            To the maximum extent permitted by applicable law:
          </p>

          <div className="space-y-3">
            <div className="p-4 rounded-lg border border-border bg-background">
              <h4 className="font-medium text-foreground mb-2">No Warranty</h4>
              <p className="text-sm">
                The Service is provided without any warranty of any kind, either 
                express or implied, including but not limited to warranties of 
                merchantability, fitness for a particular purpose, or non-infringement.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-border bg-background">
              <h4 className="font-medium text-foreground mb-2">Liability Cap</h4>
              <p className="text-sm">
                In no event shall Likho, its directors, employees, partners, agents, 
                suppliers, or affiliates be liable for any indirect, incidental, 
                special, consequential, or punitive damages, including without 
                limitation, loss of profits, data, use, goodwill, or other intangible 
                losses.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-800 dark:text-amber-300">
              <strong>Maximum Liability:</strong> Our total liability to you for 
              all claims arising from or relating to these terms or your use of 
              the Service shall not exceed the amount you paid us (if any) during 
              the 12 months preceding the claim, or $100, whichever is greater.
            </p>
          </div>
        </div>
      </section>

      {/* Section 8: Changes to Terms */}
      <section id="changes" className="mb-12 scroll-mt-20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground">
            8. Changes to Terms
          </h2>
        </div>

        <div className="space-y-4 text-muted-foreground">
          <p>
            We reserve the right to modify these terms at any time. We will notify 
            you of significant changes by:
          </p>

          <ul className="space-y-2 list-disc list-inside">
            <li>Displaying a prominent notice within the application</li>
            <li>Sending an email to your registered address</li>
            <li>Updating the &ldquo;Effective Date&rdquo; at the top of these terms</li>
          </ul>

          <p>
            Your continued use of the Service after changes constitute acceptance 
            of the modified terms. If you do not agree to the changes, you must 
            stop using the Service.
          </p>
        </div>
      </section>

      {/* Footer */}
      <div className="pt-8 border-t border-border text-center">
        <p className="text-sm text-muted-foreground mb-2">
          If you have any questions about these Terms of Service, please contact us at{" "}
          <a href="mailto:legal@likho.app" className="text-primary hover:underline">
            legal@likho.app
          </a>
        </p>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Likho Inc. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default TermsOfService;
