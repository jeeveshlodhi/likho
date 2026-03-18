import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { source } from '@/app/source';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      nav={{
        title: (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: 13,
                flexShrink: 0,
              }}
            >
              L
            </span>
            <span style={{ fontWeight: 600, letterSpacing: '-0.02em', color: 'inherit' }}>
              Likho Docs
            </span>
          </span>
        ),
        url: 'https://likho.app',
      }}
      links={[
        {
          text: 'Back to Likho',
          url: 'https://likho.app',
          active: 'nested-url',
        },
        {
          text: 'Pricing',
          url: 'https://likho.app/pricing',
          active: 'nested-url',
        },
      ]}
    >
      {children}
    </DocsLayout>
  );
}
