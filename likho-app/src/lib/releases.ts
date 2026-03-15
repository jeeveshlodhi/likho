/**
 * Desktop release / download URL for the homepage Download button.
 * Uses API when available, fallback to VITE_DESKTOP_DOWNLOAD_URL (e.g. S3).
 */

const FALLBACK_URL = import.meta.env.VITE_DESKTOP_DOWNLOAD_URL as string | undefined;

export interface DesktopRelease {
  version: string;
  download_url: string;
}

const BASE_URL = import.meta.env.VITE_API_BASE ?? "/api/v1";

/** Single in-flight request so multiple callers (Hero, Navbar, Footer, etc.) don't each hit the API. */
let cached: Promise<DesktopRelease | null> | null = null;

export async function getDesktopDownloadUrl(): Promise<DesktopRelease | null> {
  if (FALLBACK_URL) {
    return { version: "latest", download_url: FALLBACK_URL };
  }
  if (cached !== null) return cached;
  cached = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/config/releases/desktop`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) return null;
      const data = await res.json();
      return {
        version: data.version ?? "latest",
        download_url: data.download_url ?? "",
      };
    } catch {
      return null;
    }
  })();
  return cached;
}
