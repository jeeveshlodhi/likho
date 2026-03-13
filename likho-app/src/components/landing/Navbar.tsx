import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuthStore } from '@/store/authStore';
import { isTauri } from '@/utils/platform';
import { Menu, X, Github } from 'lucide-react';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const continueAsGuest = useAuthStore((s) => s.continueAsGuest);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleGuestAccess = () => {
    continueAsGuest();
    navigate('/dashboard');
  };

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Templates', href: '#templates' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Docs', href: '#docs' },
  ];

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <nav
      style={{
        backgroundColor: isScrolled ? 'rgba(255,255,255,0.95)' : '#ffffff',
        borderBottom: isScrolled ? '1px solid #e5e7eb' : '1px solid transparent',
        backdropFilter: isScrolled ? 'blur(12px)' : 'none',
      }}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 text-lg font-semibold"
            style={{ color: '#111827' }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#111827' }}
            >
              <span className="text-white text-sm font-bold">L</span>
            </div>
            <span>Likho</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => scrollToSection(link.href)}
                className="text-sm font-medium transition-colors"
                style={{ color: '#6b7280' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#111827')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
              >
                {link.label}
              </button>
            ))}
            <a
              href="https://github.com/likho/likho"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm font-medium transition-colors"
              style={{ color: '#6b7280' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#111827')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
            >
              <Github className="w-4 h-4" />
              <span>3.2k</span>
            </a>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-2">
            {isTauri() && (
              <button
                onClick={handleGuestAccess}
                className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                style={{ color: '#374151' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                Continue as Guest
              </button>
            )}
            <Link
              to="/auth/sign-in"
              className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: '#374151' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              Sign in
            </Link>
            <Link
              to="/auth/sign-up"
              className="inline-flex items-center px-4 py-1.5 text-sm font-semibold rounded-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#111827', color: '#ffffff' }}
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg transition-colors"
            style={{ color: '#6b7280' }}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div
            className="md:hidden py-4"
            style={{ borderTop: '1px solid #e5e7eb' }}
          >
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => scrollToSection(link.href)}
                  className="text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors"
                  style={{ color: '#374151' }}
                >
                  {link.label}
                </button>
              ))}
              <div className="pt-2 mt-2 flex flex-col gap-2" style={{ borderTop: '1px solid #e5e7eb' }}>
                <Link
                  to="/auth/sign-in"
                  className="px-3 py-2 text-sm font-medium"
                  style={{ color: '#374151' }}
                >
                  Sign in
                </Link>
                <Link
                  to="/auth/sign-up"
                  className="mx-3 px-4 py-2 text-sm font-semibold rounded-lg text-center"
                  style={{ backgroundColor: '#111827', color: '#ffffff' }}
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
