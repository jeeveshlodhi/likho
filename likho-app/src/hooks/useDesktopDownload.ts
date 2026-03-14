import { useEffect, useState } from 'react';
import { getDesktopDownloadUrl, type DesktopRelease } from '@/lib/releases';

export function useDesktopDownload(): DesktopRelease | null {
  const [release, setRelease] = useState<DesktopRelease | null>(null);

  useEffect(() => {
    let cancelled = false;
    getDesktopDownloadUrl().then((r) => {
      if (!cancelled && r?.download_url) setRelease(r);
    });
    return () => { cancelled = true; };
  }, []);

  return release;
}
