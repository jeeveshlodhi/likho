import { Link } from 'react-router';
import { Github, Twitter, MessageCircle } from 'lucide-react';
import { useDesktopDownload } from '@/hooks/useDesktopDownload';
import { isTauri } from '@/utils/platform';

const footerLinks = (desktopDownloadUrl: string | null) => ({
  Product: [
    ...(desktopDownloadUrl && !isTauri()
      ? [{ label: 'Download Desktop' as const, href: desktopDownloadUrl, external: true as const, route: false as const }]
      : []),
    { label: 'Features', href: '/', external: false as const, route: true as const },
    { label: 'Templates', href: '/', external: false as const, route: true as const },
    { label: 'Pricing', href: '/pricing', external: false as const, route: true as const },
    { label: 'Changelog', href: '/coming-soon', external: false as const, route: true as const },
  ],
  Resources: [
    { label: 'Docs', href: '/coming-soon', external: false as const, route: true as const },
    { label: 'API', href: '/coming-soon', external: false as const, route: true as const },
    { label: 'Community', href: '/coming-soon', external: false as const, route: true as const },
    { label: 'Support', href: '/coming-soon', external: false as const, route: true as const },
  ],
  Company: [
    { label: 'About', href: '/coming-soon', external: false as const, route: true as const },
    { label: 'Blog', href: '/coming-soon', external: false as const, route: true as const },
    { label: 'Careers', href: '/coming-soon', external: false as const, route: true as const },
    { label: 'Contact', href: '/contact', external: false as const, route: true as const },
  ],
  Legal: [
    { label: 'Privacy', href: '/privacy', external: false as const, route: true as const },
    { label: 'Terms', href: '/terms', external: false as const, route: true as const },
    { label: 'Security', href: '/security', external: false as const, route: true as const },
  ],
});

const Footer = () => {
  const desktopRelease = useDesktopDownload();
  const desktopDownloadUrl = desktopRelease?.download_url ?? null;
  const links = footerLinks(desktopDownloadUrl);

  const scrollToSection = (href: string) => {
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer style={{ backgroundColor: '#ffffff', borderTop: '1px solid #f4f4f5' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-18">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 lg:gap-10">
          {/* Brand */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-5 group w-fit">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  boxShadow: '0 2px 8px rgba(99,102,241,0.35)',
                }}
              >
                <span className="text-white text-sm font-bold">L</span>
              </div>
              <span className="text-base font-semibold tracking-tight" style={{ color: '#09090b' }}>Likho</span>
            </Link>

            <p className="text-sm mb-6 leading-relaxed" style={{ color: '#71717a', maxWidth: '22ch' }}>
              The workspace that starts ready. Built for thinkers.
            </p>

            <div className="flex items-center gap-1.5">
              {[
                { href: 'https://github.com/likho/likho', Icon: Github, label: 'GitHub' },
                { href: 'https://twitter.com/likho', Icon: Twitter, label: 'Twitter' },
                { href: 'https://discord.gg/likho', Icon: MessageCircle, label: 'Discord' },
              ].map(({ href, Icon, label }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                  style={{ backgroundColor: '#f4f4f5', color: '#71717a' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e4e4e7';
                    e.currentTarget.style.color = '#09090b';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f4f4f5';
                    e.currentTarget.style.color = '#71717a';
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([category, categoryLinks]) => (
            <div key={category}>
              <h3
                className="text-xs font-semibold uppercase tracking-widest mb-4"
                style={{ color: '#09090b' }}
              >
                {category}
              </h3>
              <ul className="space-y-3">
                {categoryLinks.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm transition-colors"
                        style={{ color: '#71717a' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#09090b')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#71717a')}
                      >
                        {link.label}
                      </a>
                    ) : link.route ? (
                      <Link
                        to={link.href}
                        className="text-sm transition-colors"
                        style={{ color: '#71717a' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#09090b')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#71717a')}
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <button
                        onClick={() => scrollToSection(link.href)}
                        className="text-sm transition-colors text-left"
                        style={{ color: '#71717a' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#09090b')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#71717a')}
                      >
                        {link.label}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: '1px solid #f4f4f5' }}
        >
          <p className="text-xs" style={{ color: '#a1a1aa' }}>
            © {new Date().getFullYear()} Likho. Built for thinkers.
          </p>
          <div className="flex items-center gap-5">
            {[
              { label: 'Privacy', href: '/privacy' },
              { label: 'Terms', href: '/terms' },
              { label: 'Security', href: '/security' },
            ].map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="text-xs transition-colors"
                style={{ color: '#a1a1aa' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#3f3f46')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#a1a1aa')}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
