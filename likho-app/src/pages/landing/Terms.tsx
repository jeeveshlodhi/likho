import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { FileText, Scale, ChevronRight } from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';

const SECTIONS = [
  {
    id: 'acceptance',
    title: 'Acceptance of Terms',
    content: `By accessing or using Likho, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.

We reserve the right to modify these terms at any time. We will notify users of any material changes via email or through the service.`,
  },
  {
    id: 'service',
    title: 'Description of Service',
    content: `Likho provides a note-taking and workspace management platform that allows users to create, organize, and collaborate on notes, kanban boards, and canvas documents.

We may update, modify, or discontinue any part of the service at any time without prior notice.`,
  },
  {
    id: 'accounts',
    title: 'User Accounts',
    content: `To use certain features of Likho, you must create an account. You are responsible for:

• Maintaining the confidentiality of your account credentials
• All activities that occur under your account
• Notifying us immediately of any unauthorized use

You must be at least 13 years old to use Likho.`,
  },
  {
    id: 'content',
    title: 'User Content',
    content: `You retain ownership of all content you create in Likho. By using our service, you grant us a license to host, store, and transmit your content solely for the purpose of providing the service.

You are solely responsible for your content and warrant that:
• You have the right to create and share the content
• Your content does not violate any laws or third-party rights
• Your content is not harmful, fraudulent, or deceptive`,
  },
  {
    id: 'acceptable-use',
    title: 'Acceptable Use',
    content: `You agree not to use Likho to:

• Violate any applicable laws or regulations
• Infringe on intellectual property rights
• Transmit harmful code or malware
• Harass, abuse, or harm others
• Interfere with the service's security features
• Scrape or extract data without authorization`,
  },
  {
    id: 'payment',
    title: 'Payment Terms',
    content: `Some features of Likho require payment. By subscribing to a paid plan:

• You agree to pay all applicable fees
• Subscription fees are billed in advance
• You may cancel at any time, but no refunds will be issued for partial months
• We may change pricing with 30 days notice

All prices are in Indian Rupees (INR) unless otherwise specified.`,
  },
  {
    id: 'termination',
    title: 'Termination',
    content: `We may suspend or terminate your account if you violate these terms. Upon termination:

• Your right to use the service ceases immediately
• We may delete your data after a reasonable grace period
• You remain liable for any outstanding payments

You may delete your account at any time through the settings.`,
  },
  {
    id: 'warranty',
    title: 'Disclaimer of Warranties',
    content: `Likho is provided "as is" without warranties of any kind, either express or implied. We do not guarantee that:

• The service will be uninterrupted or error-free
• Your data will always be secure or recoverable
• The service will meet your specific requirements`,
  },
  {
    id: 'liability',
    title: 'Limitation of Liability',
    content: `To the maximum extent permitted by law, Likho shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service.

Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.`,
  },
  {
    id: 'governing-law',
    title: 'Governing Law',
    content: `These terms shall be governed by the laws of India. Any disputes shall be resolved in the courts of New Delhi, India.

If any provision of these terms is found to be unenforceable, the remaining provisions will continue in effect.`,
  },
];

const Terms = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef(null);
  const contentRef = useRef(null);
  const isHeroInView = useInView(heroRef, { once: true });
  const isContentInView = useInView(contentRef, { once: true, margin: '-60px' });

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div ref={scrollContainerRef} className="h-full overflow-y-auto overflow-x-hidden scroll-smooth" style={{ backgroundColor: '#ffffff' }}>
      <Navbar scrollContainerRef={scrollContainerRef} />
      
      <main>
        {/* Hero Section */}
        <section
          ref={heroRef}
          className="relative pt-20 pb-0 overflow-hidden"
          style={{
            backgroundColor: '#ffffff',
            backgroundImage: 'radial-gradient(circle, #c4c4c8 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 75% 65% at 50% 30%, rgba(255,255,255,1) 0%, rgba(255,255,255,0.85) 40%, rgba(255,255,255,0.3) 70%, rgba(255,255,255,0) 100%)',
            }}
          />
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.07) 0%, transparent 70%)',
            }}
          />

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-8"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e4e4e7',
                color: '#3f3f46',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
              >
                <Scale className="w-2.5 h-2.5 text-white" />
              </div>
              Legal
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="font-black tracking-[-0.04em] leading-[0.92] mb-6"
              style={{ fontSize: 'clamp(2.8rem, 8vw, 5rem)' }}
            >
              <span style={{ color: '#a1a1aa', display: 'block', fontWeight: 800 }}>Terms of</span>
              <span style={{ color: '#09090b', display: 'block', fontWeight: 900 }}>Service.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="text-base mx-auto"
              style={{ color: '#71717a' }}
            >
              Last updated: March 20, 2026
            </motion.p>
          </div>
        </section>

        {/* Content Section with Sidebar */}
        <section ref={contentRef} className="py-16 lg:py-24 relative overflow-hidden" style={{ backgroundColor: '#ffffff' }}>
          {/* Dot pattern */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #c4c4c8 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,255,255,1) 0%, rgba(255,255,255,0.85) 50%, rgba(255,255,255,0.1) 100%)',
            }}
          />

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Sidebar Navigation */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={isContentInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5 }}
                className="hidden lg:block lg:col-span-3"
              >
                <div className="sticky top-24 space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider mb-4 px-3" style={{ color: '#a1a1aa' }}>
                    Contents
                  </p>
                  {SECTIONS.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className="w-full text-left px-3 py-2 text-sm rounded-lg transition-all"
                      style={{ color: '#71717a' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f4f4f5';
                        e.currentTarget.style.color = '#09090b';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#71717a';
                      }}
                    >
                      {section.title}
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Main Content */}
              <motion.div
                initial={{ opacity: 0, y: 28 }}
                animate={isContentInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5 }}
                className="lg:col-span-9"
              >
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e4e4e7',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.08)',
                  }}
                >
                  {/* Card Header */}
                  <div className="px-8 py-6 border-b" style={{ borderColor: '#f4f4f5', backgroundColor: '#fafafa' }}>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{
                          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                          boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
                        }}
                      >
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold" style={{ color: '#09090b' }}>Terms of Service</h3>
                        <p className="text-xs" style={{ color: '#a1a1aa' }}>Please read carefully</p>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-8 lg:p-10">
                    {SECTIONS.map((section, index) => (
                      <motion.div
                        key={section.id}
                        id={section.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={isContentInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                        className={index !== SECTIONS.length - 1 ? 'pb-10 mb-10' : ''}
                        style={index !== SECTIONS.length - 1 ? { borderBottom: '1px solid #f4f4f5' } : {}}
                      >
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-3" style={{ color: '#09090b' }}>
                          <span
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                            style={{ backgroundColor: '#eef2ff', color: '#6366f1' }}
                          >
                            {index + 1}
                          </span>
                          {section.title}
                        </h2>
                        <div className="text-sm leading-7 pl-11" style={{ color: '#3f3f46' }}>
                          {section.content.split('\n').map((paragraph, i) => (
                            paragraph.startsWith('•') ? (
                              <li key={i} className="ml-4 mb-2">{paragraph.slice(2)}</li>
                            ) : paragraph.trim() ? (
                              <p key={i} className="mb-4">{paragraph}</p>
                            ) : null
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Contact Notice */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={isContentInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl"
                  style={{ backgroundColor: '#fafafa', border: '1px solid #e4e4e7' }}
                >
                  <p className="text-sm" style={{ color: '#71717a' }}>
                    Questions about these terms?
                  </p>
                  <a
                    href="/contact"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                    style={{
                      backgroundColor: '#09090b',
                      color: '#fafafa',
                    }}
                  >
                    Contact us
                    <ChevronRight className="w-4 h-4" />
                  </a>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Terms;
