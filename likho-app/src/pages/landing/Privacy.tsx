import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Shield, Lock, ChevronRight } from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';

const SECTIONS = [
  {
    id: 'collection',
    title: 'Information We Collect',
    content: `We collect the following types of information:

Account Information: When you sign up, we collect your name, email address, and password (encrypted).

Content: All notes, documents, and files you create and store in Likho.

Usage Data: We collect information about how you use the service, including features accessed, time spent, and interaction patterns.

Device Information: We may collect information about the device you use to access Likho, including browser type, operating system, and IP address.`,
  },
  {
    id: 'usage',
    title: 'How We Use Your Information',
    content: `We use your information to:

• Provide, maintain, and improve Likho
• Process your transactions and send related information
• Send you technical notices, updates, and support messages
• Respond to your comments and questions
• Monitor and analyze trends, usage, and activities
• Detect, prevent, and address technical issues and fraud

We will never sell your personal information to third parties.`,
  },
  {
    id: 'security',
    title: 'Data Storage and Security',
    content: `Your data is stored securely on our servers with industry-standard encryption:

• All data is encrypted in transit using TLS 1.3
• Data at rest is encrypted using AES-256
• We use secure, SOC 2 compliant data centers
• Regular security audits and penetration testing

While we take reasonable measures to protect your data, no security system is impenetrable.`,
  },
  {
    id: 'rights',
    title: 'Your Data Rights',
    content: `You have the following rights regarding your data:

Access: You can access all your data through the Likho interface.

Export: You can export your data at any time in standard formats.

Deletion: You can delete your account and all associated data through settings.

Correction: You can update or correct your personal information.

To exercise these rights, contact us at privacy@likho.app.`,
  },
  {
    id: 'retention',
    title: 'Data Retention',
    content: `We retain your data as follows:

Active Accounts: Data is retained for as long as your account is active.

Deleted Accounts: Upon deletion, your data is permanently removed within 30 days, except where we are legally required to retain it.

Backups: Backups may retain data for up to 90 days after deletion.

Version History: We retain version history according to your plan limits.`,
  },
  {
    id: 'third-party',
    title: 'Third-Party Services',
    content: `We use the following third-party services:

• Cloud hosting providers (AWS, Google Cloud)
• Payment processors (Razorpay, Stripe) - for paid plans only
• Analytics services (Plausible Analytics) - privacy-focused, no personal data

These services have access to only the information necessary to perform their functions and are contractually obligated to maintain confidentiality.`,
  },
  {
    id: 'cookies',
    title: 'Cookies and Tracking',
    content: `We use minimal cookies and tracking:

Essential Cookies: Required for the service to function (session, authentication).

Analytics: We use privacy-focused analytics that do not track you across websites or collect personal information.

No Marketing Cookies: We do not use cookies for advertising or marketing purposes.

You can disable cookies in your browser, but this may affect functionality.`,
  },
  {
    id: 'children',
    title: "Children's Privacy",
    content: `Likho is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.

If we learn we have collected personal information from a child under 13, we will delete that information as quickly as possible.

If you believe we might have information from a child under 13, please contact us at privacy@likho.app.`,
  },
  {
    id: 'transfers',
    title: 'International Data Transfers',
    content: `Your data may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws.

We ensure appropriate safeguards are in place for international transfers, including:
• Standard Contractual Clauses
• Adequacy decisions where applicable
• Data processing agreements with service providers`,
  },
  {
    id: 'changes',
    title: 'Changes to This Policy',
    content: `We may update this Privacy Policy from time to time. We will notify you of any material changes by:

• Sending an email to the address associated with your account
• Posting a notice on our website
• Displaying a notification in the application

Your continued use of Likho after changes constitutes acceptance of the updated policy.`,
  },
];

const Privacy = () => {
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
                <Shield className="w-2.5 h-2.5 text-white" />
              </div>
              Your Data
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="font-black tracking-[-0.04em] leading-[0.92] mb-6"
              style={{ fontSize: 'clamp(2.8rem, 8vw, 5rem)' }}
            >
              <span style={{ color: '#a1a1aa', display: 'block', fontWeight: 800 }}>Privacy</span>
              <span style={{ color: '#09090b', display: 'block', fontWeight: 900 }}>Policy.</span>
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
                        <Lock className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold" style={{ color: '#09090b' }}>Privacy Policy</h3>
                        <p className="text-xs" style={{ color: '#a1a1aa' }}>How we handle your data</p>
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
                            style={{ backgroundColor: '#f5f3ff', color: '#8b5cf6' }}
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
                    Questions about privacy?
                  </p>
                  <a
                    href="mailto:privacy@likho.app"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                    style={{
                      backgroundColor: '#09090b',
                      color: '#fafafa',
                    }}
                  >
                    Contact privacy team
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

export default Privacy;
