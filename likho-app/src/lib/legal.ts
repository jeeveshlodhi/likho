/**
 * Legal utilities for managing beta agreements, cookie consent, and privacy preferences.
 * All data is stored locally in localStorage.
 */

// Storage keys
const BETA_AGREEMENT_KEY = 'likho_beta_agreement';
const COOKIE_CONSENT_KEY = 'likho_cookie_consent';

/**
 * Beta agreement data structure
 */
export interface BetaAgreementData {
  /** Whether the user accepted the beta agreement */
  accepted: boolean;
  /** User's full name */
  name: string;
  /** User's email address */
  email: string;
  /** Whether user agrees this is beta software */
  understandsBeta: boolean;
  /** Whether user agrees to provide feedback */
  agreesToFeedback: boolean;
  /** Whether user allows anonymous analytics */
  allowsAnalytics: boolean;
  /** ISO timestamp of acceptance */
  acceptedAt: string;
  /** Version of the beta agreement accepted */
  version: string;
}

/**
 * Cookie consent preferences
 */
export interface CookiePreferences {
  /** Essential cookies (always required) */
  essential: boolean;
  /** Analytics/tracking cookies */
  analytics: boolean;
  /** Whether preferences have been set */
  hasConsented: boolean;
  /** ISO timestamp of consent */
  consentedAt?: string;
}

/**
 * Default cookie preferences (only essential cookies)
 */
const defaultCookiePreferences: CookiePreferences = {
  essential: true,
  analytics: false,
  hasConsented: false,
};

/**
 * Check if the user has accepted the beta agreement
 * @returns boolean indicating if agreement was accepted
 */
export function checkAgreementAccepted(): boolean {
  try {
    const data = localStorage.getItem(BETA_AGREEMENT_KEY);
    if (!data) return false;
    
    const parsed: BetaAgreementData = JSON.parse(data);
    return parsed.accepted === true;
  } catch {
    return false;
  }
}

/**
 * Accept the beta agreement and store user data
 * @param data - The beta agreement data to store
 * @returns The stored agreement data with timestamp
 */
export function acceptAgreement(
  data: Omit<BetaAgreementData, 'accepted' | 'acceptedAt' | 'version'>
): BetaAgreementData {
  const agreementData: BetaAgreementData = {
    ...data,
    accepted: true,
    acceptedAt: new Date().toISOString(),
    version: '1.0.0', // Current beta agreement version
  };
  
  localStorage.setItem(BETA_AGREEMENT_KEY, JSON.stringify(agreementData));
  return agreementData;
}

/**
 * Get the stored agreement data
 * @returns The agreement data or null if not found
 */
export function getAgreementData(): BetaAgreementData | null {
  try {
    const data = localStorage.getItem(BETA_AGREEMENT_KEY);
    if (!data) return null;
    
    return JSON.parse(data) as BetaAgreementData;
  } catch {
    return null;
  }
}

/**
 * Revoke the beta agreement (for testing or user request)
 */
export function revokeAgreement(): void {
  localStorage.removeItem(BETA_AGREEMENT_KEY);
}

/**
 * Check if user has set cookie preferences
 * @returns boolean indicating if cookie consent has been given
 */
export function checkCookieConsent(): boolean {
  try {
    const data = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!data) return false;
    
    const parsed: CookiePreferences = JSON.parse(data);
    return parsed.hasConsented === true;
  } catch {
    return false;
  }
}

/**
 * Get current cookie preferences
 * @returns CookiePreferences object (returns defaults if not set)
 */
export function getCookiePreferences(): CookiePreferences {
  try {
    const data = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!data) return { ...defaultCookiePreferences };
    
    const parsed: CookiePreferences = JSON.parse(data);
    return {
      ...defaultCookiePreferences,
      ...parsed,
      essential: true, // Always ensure essential is true
    };
  } catch {
    return { ...defaultCookiePreferences };
  }
}

/**
 * Set cookie preferences
 * @param prefs - Partial preferences to set
 * @returns The complete cookie preferences
 */
export function setCookiePreferences(
  prefs: Partial<Omit<CookiePreferences, 'essential' | 'hasConsented'>>
): CookiePreferences {
  const current = getCookiePreferences();
  const updated: CookiePreferences = {
    ...current,
    ...prefs,
    essential: true, // Essential cookies always enabled
    hasConsented: true,
    consentedAt: new Date().toISOString(),
  };
  
  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(updated));
  return updated;
}

/**
 * Reset cookie consent (clears preferences)
 */
export function resetCookieConsent(): void {
  localStorage.removeItem(COOKIE_CONSENT_KEY);
}

/**
 * Check if analytics cookies are allowed
 * @returns boolean indicating if analytics is enabled
 */
export function isAnalyticsAllowed(): boolean {
  const prefs = getCookiePreferences();
  return prefs.analytics === true;
}

/**
 * Get the formatted acceptance date
 * @returns Formatted date string or null
 */
export function getFormattedAcceptanceDate(): string | null {
  const data = getAgreementData();
  if (!data?.acceptedAt) return null;
  
  return new Date(data.acceptedAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
