import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ShieldCheck, Lock, Server, Key, Eye, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';

const SECURITY_FEATURES = [
  {
    icon: Lock,
    title: 'End-to-End Encryption',
    description: 'Your data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption.',
    color: '#6366f1',
    bg: '#eef2ff',
  },
  {
    icon: Server,
    title: 'Secure Infrastructure',
    description: 'Hosted on SOC 2 compliant cloud providers with 99.9% uptime SLA and multi-region redundancy.',
    color: '#8b5cf6',
    bg: '#f5f3ff',
  },
  {
    icon: Key,
    title: 'Secure Authentication',
    description: 'OAuth 2.0 and secure password hashing with bcrypt. Optional two-factor authentication.',
    color: '#10b981',
    bg: '#ecfdf5',
  },
  {
    icon: Eye,
    title: 'Access Controls',
    description: 'Granular workspace permissions. Control who can view, edit, or share your content.',
    color: '#06b6d4',
    bg: '#ecfeff',
  },
];

const PRACTICES = [
  'Regular security audits and penetration testing',
  'Automated vulnerability scanning',
  'Security bug bounty program',
  'Employee security training',
  'Strict access controls and logging',
  'Regular backup and disaster recovery testing',
];

const COMPLIANCE = [
  { name: 'SOC 2 Type II', status: 'In Progress' },
  { name: 'GDPR', status: 'Compliant' },
  { name: 'ISO 27001', status: 'Planned' },
];

const Security = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const practicesRef = useRef(null);
  const isHeroInView = useInView(heroRef, { once: true });
  const isFeaturesInView = useInView(featuresRef, { once: true, margin: '-60px' });
  const isPracticesInView = useInView(practicesRef, { once: true, margin: '-60px' });

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

          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-16 text-center">
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
                <ShieldCheck className="w-2.5 h-2.5 text-white" />
              </div>
              Trust & Safety
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="font-black tracking-[-0.04em] leading-[0.92] mb-6"
              style={{ fontSize: 'clamp(2.8rem, 8vw, 5rem)' }}
            >
              <span style={{ color: '#a1a1aa', display: 'block', fontWeight: 800 }}>Your data is</span>
              <span style={{ color: '#09090b', display: 'block', fontWeight: 900 }}>protected.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="text-lg mx-auto leading-relaxed"
              style={{ color: '#71717a', maxWidth: '46ch' }}
            >
              Security is built into every layer of Likho. We use industry-leading practices to keep your data safe.
            </motion.p>
          </div>
        </section>

        {/* Security Features Grid */}
        <section ref={featuresRef} className="py-24 lg:py-32 relative overflow-hidden" style={{ backgroundColor: '#ffffff' }}>
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
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={isFeaturesInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
              className="text-center mb-14"
            >
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold mb-7 tracking-wide uppercase"
                style={{ backgroundColor: '#f5f3ff', color: '#8b5cf6', border: '1px solid #ddd6fe' }}
              >
                <ShieldCheck className="w-3 h-3" />
                Security Features
              </div>
              <h2 className="font-black tracking-[-0.04em] leading-[0.92]" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}>
                <span style={{ color: '#09090b', fontWeight: 900 }}>How we protect you</span>
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {SECURITY_FEATURES.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 28 }}
                    animate={isFeaturesInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="relative flex flex-col rounded-2xl p-7"
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e4e4e7',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)',
                    }}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: feature.bg }}
                      >
                        <Icon className="w-6 h-6" style={{ color: feature.color }} />
                      </div>
                      <h3 className="text-base font-bold" style={{ color: '#09090b' }}>
                        {feature.title}
                      </h3>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: '#71717a' }}>
                      {feature.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Security Practices & Compliance */}
        <section ref={practicesRef} className="py-24 lg:py-32 relative overflow-hidden" style={{ backgroundColor: '#fafafa' }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Security Practices */}
              <motion.div
                initial={{ opacity: 0, y: 28 }}
                animate={isPracticesInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5 }}
                className="rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e4e4e7',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.08)',
                }}
              >
                <div className="px-8 py-6 border-b" style={{ borderColor: '#f4f4f5', backgroundColor: '#fafafa' }}>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                        boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
                      }}
                    >
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold" style={{ color: '#09090b' }}>Security Practices</h3>
                      <p className="text-xs" style={{ color: '#a1a1aa' }}>How we maintain security</p>
                    </div>
                  </div>
                </div>
                <div className="p-8">
                  <ul className="space-y-4">
                    {PRACTICES.map((practice, index) => (
                      <motion.li
                        key={practice}
                        initial={{ opacity: 0, x: -10 }}
                        animate={isPracticesInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="flex items-start gap-3"
                      >
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: '#dcfce7' }}
                        >
                          <CheckCircle2 className="w-3 h-3" style={{ color: '#16a34a' }} />
                        </div>
                        <span className="text-sm" style={{ color: '#3f3f46' }}>
                          {practice}
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </motion.div>

              {/* Compliance Status */}
              <motion.div
                initial={{ opacity: 0, y: 28 }}
                animate={isPracticesInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e4e4e7',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.08)',
                }}
              >
                <div className="px-8 py-6 border-b" style={{ borderColor: '#f4f4f5', backgroundColor: '#fafafa' }}>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
                      }}
                    >
                      <AlertTriangle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold" style={{ color: '#09090b' }}>Compliance</h3>
                      <p className="text-xs" style={{ color: '#a1a1aa' }}>Certifications & standards</p>
                    </div>
                  </div>
                </div>
                <div className="p-8">
                  <div className="space-y-4">
                    {COMPLIANCE.map((item, index) => (
                      <motion.div
                        key={item.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={isPracticesInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                        className="flex items-center justify-between py-3 px-4 rounded-xl"
                        style={{ backgroundColor: '#fafafa', border: '1px solid #f4f4f5' }}
                      >
                        <span className="text-sm font-semibold" style={{ color: '#09090b' }}>
                          {item.name}
                        </span>
                        <span
                          className="text-xs font-medium px-2.5 py-1 rounded-full"
                          style={{
                            backgroundColor: item.status === 'Compliant' ? '#dcfce7' : '#fef3c7',
                            color: item.status === 'Compliant' ? '#16a34a' : '#a16207',
                          }}
                        >
                          {item.status}
                        </span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Security Contact */}
                  <div className="mt-8 pt-6" style={{ borderTop: '1px solid #f4f4f5' }}>
                    <p className="text-sm mb-4" style={{ color: '#a1a1aa' }}>
                      Found a security issue?
                    </p>
                    <a
                      href="mailto:security@likho.app"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                      style={{
                        backgroundColor: '#09090b',
                        color: '#fafafa',
                      }}
                    >
                      <AlertTriangle className="w-4 h-4" />
                      Report Vulnerability
                    </a>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Security;
