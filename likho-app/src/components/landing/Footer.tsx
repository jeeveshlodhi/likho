import { Link } from 'react-router';
import { Github, Twitter, MessageCircle } from 'lucide-react';

const footerLinks = {
  Product: [
    { label: 'Features', href: '#features' },
    { label: 'Templates', href: '#templates' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Changelog', href: '#changelog' },
  ],
  Resources: [
    { label: 'Docs', href: '#docs' },
    { label: 'API', href: '#api' },
    { label: 'Community', href: '#community' },
    { label: 'Support', href: '#support' },
  ],
  Company: [
    { label: 'About', href: '#about' },
    { label: 'Blog', href: '#blog' },
    { label: 'Careers', href: '#careers' },
    { label: 'Contact', href: '#contact' },
  ],
  Legal: [
    { label: 'Privacy', href: '#privacy' },
    { label: 'Terms', href: '#terms' },
    { label: 'Security', href: '#security' },
  ],
};

const Footer = () => {
  const scrollToSection = (href: string) => {
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <footer className="border-t border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <span className="text-white text-sm font-bold">L</span>
              </div>
              <span className="text-lg font-semibold text-foreground">Likho</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              A workspace that starts ready. Built for thinkers.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/likho/likho"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-surface border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-indigo-500/30 transition-colors"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com/likho"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-surface border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-indigo-500/30 transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://discord.gg/likho"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-surface border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-indigo-500/30 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-foreground mb-4">{category}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => scrollToSection(link.href)}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Likho. Built for thinkers.
          </p>
          <div className="flex items-center gap-6">
            <button
              onClick={() => scrollToSection('#privacy')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy
            </button>
            <button
              onClick={() => scrollToSection('#terms')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms
            </button>
            <a
              href="https://github.com/likho/likho"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
