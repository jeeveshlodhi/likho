import { cn } from "@/lib/utils";
import { 
  Shield, 
  Database, 
  Lock, 
  UserCheck, 
  Mail, 
  Calendar,
  Server,
  Eye,
  FileText,
  Cookie
} from "lucide-react";

interface PrivacyPolicyProps {
  /** Optional className for styling */
  className?: string;
  /** Last updated date - defaults to current date if not provided */
  lastUpdated?: string;
}

/**
 * Privacy Policy Component
 * 
 * A comprehensive privacy policy display for the Likho beta application.
 * Covers data collection, usage, storage, user rights, and contact information.
 */
export function PrivacyPolicy({ 
  className,
  lastUpdated = "March 11, 2026"
}: PrivacyPolicyProps) {
  return (
    <div className={cn("max-w-4xl mx-auto px-6 py-12", className)}>
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">
          Privacy Policy
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Your privacy is important to us. This policy explains how Likho collects, 
          uses, and protects your personal information during the beta period.
        </p>
        <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>Last updated: {lastUpdated}</span>
        </div>
      </div>

      {/* Table of Contents */}
      <div className="bg-surface rounded-lg p-6 mb-10">
        <h2 className="text-lg font-semibold mb-4">Contents</h2>
        <nav className="grid gap-2 sm:grid-cols-2">
          {[
            { id: "collection", label: "Data We Collect" },
            { id: "usage", label: "How We Use Data" },
            { id: "storage", label: "Data Storage & Security" },
            { id: "cookies", label: "Cookies & Tracking" },
            { id: "rights", label: "Your Rights" },
            { id: "contact", label: "Contact Us" },
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

      {/* Section 1: Data We Collect */}
      <section id="collection" className="mb-12 scroll-mt-20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Database className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground">
            Data We Collect
          </h2>
        </div>
        
        <div className="space-y-6 text-muted-foreground">
          <p>
            During the beta period, we collect the following types of information 
            to provide and improve our services:
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="p-4 rounded-lg border border-border bg-background">
              <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-primary" />
                Account Information
              </h3>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Name and email address</li>
                <li>Profile information</li>
                <li>Authentication credentials</li>
              </ul>
            </div>

            <div className="p-4 rounded-lg border border-border bg-background">
              <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Content Data
              </h3>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Notes and documents you create</li>
                <li>Canvas drawings and diagrams</li>
                <li>Kanban board configurations</li>
              </ul>
            </div>

            <div className="p-4 rounded-lg border border-border bg-background">
              <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" />
                Usage Data
              </h3>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Feature usage statistics</li>
                <li>App performance metrics</li>
                <li>Session duration and frequency</li>
              </ul>
            </div>

            <div className="p-4 rounded-lg border border-border bg-background">
              <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
                <Server className="w-4 h-4 text-primary" />
                Technical Data
              </h3>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Device type and OS version</li>
                <li>App version and build number</li>
                <li>Crash reports and error logs</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: How We Use Data */}
      <section id="usage" className="mb-12 scroll-mt-20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground">
            How We Use Your Data
          </h2>
        </div>

        <div className="space-y-4 text-muted-foreground">
          <p>We use the collected information for the following purposes:</p>
          
          <ul className="space-y-3">
            {[
              {
                title: "Service Provision",
                desc: "To provide, maintain, and improve the Likho application and its features."
              },
              {
                title: "Beta Testing",
                desc: "To identify bugs, gather feedback, and enhance the user experience during the beta period."
              },
              {
                title: "Communication",
                desc: "To send you updates about the beta, respond to your feedback, and notify you of important changes."
              },
              {
                title: "Security",
                desc: "To detect and prevent fraud, abuse, and security incidents."
              },
              {
                title: "Analytics",
                desc: "To understand how users interact with our app and make data-driven improvements."
              }
            ].map((item, index) => (
              <li key={index} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center mt-0.5">
                  {index + 1}
                </span>
                <div>
                  <span className="font-medium text-foreground">{item.title}:</span>{" "}
                  {item.desc}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Section 3: Data Storage & Security */}
      <section id="storage" className="mb-12 scroll-mt-20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground">
            Data Storage & Security
          </h2>
        </div>

        <div className="space-y-4 text-muted-foreground">
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <p className="text-sm text-green-700 dark:text-green-400">
              <strong>End-to-End Encryption:</strong> Your notes and personal content 
              are encrypted both in transit and at rest using industry-standard encryption 
              protocols (AES-256).
            </p>
          </div>

          <p>We implement comprehensive security measures to protect your data:</p>

          <ul className="space-y-2 list-disc list-inside">
            <li>All data is stored on secure, SOC 2 compliant servers</li>
            <li>Regular security audits and penetration testing</li>
            <li>Strict access controls and employee training</li>
            <li>Automated backup systems with redundancy</li>
            <li>Regular security updates and patches</li>
          </ul>

          <div className="mt-4 p-4 rounded-lg bg-muted">
            <p className="text-sm">
              <strong>Data Retention:</strong> We retain your data for as long as your 
              account is active. You can request data deletion at any time by contacting 
              us. Crash reports and anonymized analytics may be retained longer for 
              diagnostic purposes.
            </p>
          </div>
        </div>
      </section>

      {/* Section 4: Cookies & Tracking */}
      <section id="cookies" className="mb-12 scroll-mt-20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Cookie className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground">
            Cookies & Tracking
          </h2>
        </div>

        <div className="space-y-4 text-muted-foreground">
          <p>
            Likho uses cookies and similar technologies to enhance your experience 
            and collect usage data:
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg border border-border">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-foreground">Essential Cookies</h4>
                <p className="text-sm">
                  Required for the app to function properly. Cannot be disabled.
                  Includes authentication and session management.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg border border-border">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-foreground">Analytics Cookies</h4>
                <p className="text-sm">
                  Help us understand how users interact with the app. All data is 
                  anonymized. You can opt out in your privacy settings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: User Rights */}
      <section id="rights" className="mb-12 scroll-mt-20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <UserCheck className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground">
            Your Rights
          </h2>
        </div>

        <div className="space-y-4 text-muted-foreground">
          <p>
            Depending on your location, you have certain rights regarding your personal data:
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { right: "Access", desc: "Request a copy of your personal data" },
              { right: "Correction", desc: "Update or correct inaccurate information" },
              { right: "Deletion", desc: "Request deletion of your data" },
              { right: "Portability", desc: "Export your data in a portable format" },
              { right: "Objection", desc: "Opt out of certain data processing" },
              { right: "Restriction", desc: "Limit how we use your data" },
            ].map((item) => (
              <div 
                key={item.right}
                className="p-3 rounded-lg bg-surface"
              >
                <h4 className="font-medium text-foreground text-sm">{item.right}</h4>
                <p className="text-xs mt-1">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-sm text-blue-700 dark:text-blue-400">
              <strong>GDPR & CCPA Compliance:</strong> Residents of the EU/EEA and 
              California have additional rights under GDPR and CCPA respectively. 
              Contact us to exercise these rights.
            </p>
          </div>
        </div>
      </section>

      {/* Section 6: Contact */}
      <section id="contact" className="mb-12 scroll-mt-20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Mail className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground">
            Contact Us
          </h2>
        </div>

        <div className="space-y-4 text-muted-foreground">
          <p>
            If you have any questions about this Privacy Policy or how we handle 
            your data, please contact us:
          </p>

          <div className="p-4 rounded-lg border border-border bg-background">
            <div className="space-y-2">
              <p className="text-foreground">
                <strong>Email:</strong>{" "}
                <a 
                  href="mailto:privacy@likho.app" 
                  className="text-primary hover:underline"
                >
                  privacy@likho.app
                </a>
              </p>
              <p className="text-foreground">
                <strong>Address:</strong> Likho Inc., 123 Innovation Drive, 
                San Francisco, CA 94105, USA
              </p>
              <p className="text-sm mt-2">
                We aim to respond to all privacy-related inquiries within 48 hours.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
        <p>
          By using Likho during the beta period, you acknowledge that you have 
          read and understood this Privacy Policy.
        </p>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
