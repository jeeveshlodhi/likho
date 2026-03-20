import { useState, useEffect, RefObject } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuthStore } from '@/store/authStore';
import { isTauri } from '@/utils/platform';
import { useDesktopDownload } from '@/hooks/useDesktopDownload';
import { Menu, X, Download } from 'lucide-react';

interface NavbarProps {
  scrollContainerRef?: RefObject<HTMLElement | null>;
}

const Navbar = ({ scrollContainerRef }: NavbarProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const continueAsGuest = useAuthStore((s) => s.continueAsGuest);
  const desktopRelease = useDesktopDownload();

  useEffect(() => {
    const container = scrollContainerRef?.current;
    
    const handleScroll = () => {
      const scrollY = container ? container.scrollTop : window.scrollY;
      setIsScrolled(scrollY > 10);
    };
    
    // Check initial scroll position
    handleScroll();
    
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    } else {
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [scrollContainerRef]);

  const handleGuestAccess = () => {
    continueAsGuest();
    navigate('/dashboard');
  };

  const navLinks = [
    { label: 'Features', href: '/#features', external: false, route: true },
    { label: 'Templates', href: '/#templates', external: false, route: true },
    { label: 'Pricing', href: '/pricing', external: false, route: true },
    { label: 'Contact', href: '/contact', external: false, route: true },
  ];

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
    setIsMobileMenuOpen(false);
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        backgroundColor: isScrolled ? 'rgba(255,255,255,0.9)' : 'transparent',
        borderBottom: isScrolled ? '1px solid #e4e4e7' : '1px solid transparent',
        backdropFilter: isScrolled ? 'blur(20px) saturate(180%)' : 'none',
        WebkitBackdropFilter: isScrolled ? 'blur(20px) saturate(180%)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                boxShadow: '0 2px 8px rgba(99,102,241,0.4)',
              }}
            >
              <span className="text-white text-sm font-bold tracking-tight">L</span>
            </div>
            <span
              className="text-base font-semibold tracking-tight"
              style={{ color: '#09090b' }}
            >
              Likho
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => {
              const sharedStyle: React.CSSProperties = { color: '#71717a' };
              const hoverIn = (e: React.MouseEvent<HTMLElement>) => {
                e.currentTarget.style.color = '#09090b';
                e.currentTarget.style.backgroundColor = '#f4f4f5';
              };
              const hoverOut = (e: React.MouseEvent<HTMLElement>) => {
                e.currentTarget.style.color = '#71717a';
                e.currentTarget.style.backgroundColor = 'transparent';
              };
              const className = "px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-150";
              if (link.route) {
                return (
                  <Link key={link.label} to={link.href} className={className} style={sharedStyle}
                    onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
                    {link.label}
                  </Link>
                );
              }
              if (link.external) {
                return (
                  <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer"
                    className={className} style={sharedStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
                    {link.label}
                  </a>
                );
              }
              return (
                <button key={link.label} onClick={() => scrollToSection(link.href)}
                  className={className} style={sharedStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
                  {link.label}
                </button>
              );
            })}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-1.5">
            {desktopRelease && !isTauri() && (
              <a
                href={desktopRelease.download_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150"
                style={{ color: '#71717a' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#09090b';
                  e.currentTarget.style.backgroundColor = '#f4f4f5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#71717a';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Download className="w-4 h-4" />
                Download
              </a>
            )}

            {isTauri() && (
              <button
                onClick={handleGuestAccess}
                className="px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150"
                style={{ color: '#71717a' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#09090b';
                  e.currentTarget.style.backgroundColor = '#f4f4f5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#71717a';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Continue as Guest
              </button>
            )}

            <Link
              to="/auth/sign-in"
              className="px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-150"
              style={{ color: '#3f3f46' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#09090b';
                e.currentTarget.style.backgroundColor = '#f4f4f5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#3f3f46';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Sign in
            </Link>

            <Link
              to="/auth/sign-up"
              className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-150 hover:opacity-90 active:scale-95"
              style={{
                backgroundColor: '#09090b',
                color: '#fafafa',
                boxShadow: '0 1px 2px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)',
              }}
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg transition-colors"
            style={{ color: '#71717a' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f4f4f5'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-3" style={{ borderTop: '1px solid #e4e4e7' }}>
            <div className="flex flex-col gap-0.5">
              {navLinks.map((link) => {
                const cls = "text-left px-3 py-2.5 text-sm font-medium rounded-lg transition-colors block w-full";
                const st: React.CSSProperties = { color: '#3f3f46' };
                const hi = (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.backgroundColor = '#f4f4f5'; };
                const ho = (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.backgroundColor = 'transparent'; };
                if (link.route) {
                  return (
                    <Link key={link.label} to={link.href} className={cls} style={st}
                      onMouseEnter={hi} onMouseLeave={ho} onClick={() => setIsMobileMenuOpen(false)}>
                      {link.label}
                    </Link>
                  );
                }
                if (link.external) {
                  return (
                    <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer"
                      className={cls} style={st} onMouseEnter={hi} onMouseLeave={ho}
                      onClick={() => setIsMobileMenuOpen(false)}>
                      {link.label}
                    </a>
                  );
                }
                return (
                  <button key={link.label} onClick={() => scrollToSection(link.href)}
                    className={cls} style={st} onMouseEnter={hi} onMouseLeave={ho}>
                    {link.label}
                  </button>
                );
              })}
              <div className="pt-3 mt-2 flex flex-col gap-2" style={{ borderTop: '1px solid #e4e4e7' }}>
                {desktopRelease && !isTauri() && (
                  <a
                    href={desktopRelease.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg"
                    style={{ color: '#3f3f46', border: '1px solid #e4e4e7' }}
                  >
                    <Download className="w-4 h-4" />
                    Download Desktop App
                  </a>
                )}
                <Link
                  to="/auth/sign-in"
                  className="px-4 py-2.5 text-sm font-medium text-center rounded-lg"
                  style={{ color: '#3f3f46' }}
                >
                  Sign in
                </Link>
                <Link
                  to="/auth/sign-up"
                  className="px-4 py-2.5 text-sm font-semibold rounded-lg text-center"
                  style={{ backgroundColor: '#09090b', color: '#fafafa' }}
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
