import { Link } from 'react-router';
import { Github, Twitter, MessageCircle } from 'lucide-react';
import { useDesktopDownload } from '@/hooks/useDesktopDownload';
import { isTauri } from '@/utils/platform';

const footerLinks = (desktopDownloadUrl: string | null) => ({
  Product: [
    ...(desktopDownloadUrl && !isTauri()
      ? [{ label: 'Download Tauro (Desktop)' as const, href: desktopDownloadUrl, external: true as const }]
      : []),
    { label: 'Features', href: '#features', external: false as const },
    { label: 'Templates', href: '#templates', external: false as const },
    { label: 'Pricing', href: '#pricing', external: false as const },
    { label: 'Changelog', href: '#changelog', external: false as const },
  ],
  Resources: [
    { label: 'Docs', href: '#docs', external: false as const },
    { label: 'API', href: '#api', external: false as const },
    { label: 'Community', href: '#community', external: false as const },
    { label: 'Support', href: '#support', external: false as const },
  ],
  Company: [
    { label: 'About', href: '#about', external: false as const },
    { label: 'Blog', href: '#blog', external: false as const },
    { label: 'Careers', href: '#careers', external: false as const },
    { label: 'Contact', href: '#contact', external: false as const },
  ],
  Legal: [
    { label: 'Privacy', href: '#privacy', external: false as const },
    { label: 'Terms', href: '#terms', external: false as const },
    { label: 'Security', href: '#security', external: false as const },
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
    <footer style={{ backgroundColor: '#ffffff', borderTop: '1px solid #f3f4f6' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: '#111827' }}
              >
                <span className="text-white text-sm font-bold">L</span>
              </div>
              <span className="text-base font-semibold" style={{ color: '#111827' }}>Likho</span>
            </Link>
            <p className="text-sm mb-5 max-w-xs" style={{ color: '#6b7280' }}>
              A workspace that starts ready. Built for thinkers.
            </p>
            <div className="flex items-center gap-2">
              {[
                { href: 'https://github.com/likho/likho', Icon: Github },
                { href: 'https://twitter.com/likho', Icon: Twitter },
                { href: 'https://discord.gg/likho', Icon: MessageCircle },
              ].map(({ href, Icon }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                  style={{ backgroundColor: '#f3f4f6', color: '#6b7280' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e5e7eb';
                    e.currentTarget.style.color = '#111827';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                    e.currentTarget.style.color = '#6b7280';
                  }}
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(links).map(([category, categoryLinks]) => (
            <div key={category}>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#111827' }}>
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
                        style={{ color: '#6b7280' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#111827')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
                      >
                        {link.label}
                      </a>
                    ) : (
                      <button
                        onClick={() => scrollToSection(link.href)}
                        className="text-sm transition-colors"
                        style={{ color: '#6b7280' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#111827')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
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

        {/* Bottom */}
        <div
          className="mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: '1px solid #f3f4f6' }}
        >
          <p className="text-xs" style={{ color: '#9ca3af' }}>
            © {new Date().getFullYear()} Likho. Built for thinkers.
          </p>
          <div className="flex items-center gap-5">
            {['Privacy', 'Terms', 'GitHub'].map((item) => (
              <button
                key={item}
                onClick={() => scrollToSection(`#${item.toLowerCase()}`)}
                className="text-xs transition-colors"
                style={{ color: '#9ca3af' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#374151')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
