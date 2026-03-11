/**
 * Legal Components
 * 
 * Components for displaying legal documentation and managing user agreements.
 * All components use Tailwind CSS for styling and follow the project's design system.
 */

export { PrivacyPolicy } from "./PrivacyPolicy";
export { TermsOfService } from "./TermsOfService";
export { BetaAgreement } from "./BetaAgreement";
export { CookieConsent, CookieSettingsButton } from "./CookieConsent";

// Re-export types from legal utilities
export type { 
  BetaAgreementData, 
  CookiePreferences 
} from "@/lib/legal";
