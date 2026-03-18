import { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router';
import {
  Check, Zap, Users, Building2, ArrowRight, Sparkles,
  FileText, LayoutGrid, Palette, Lock, Infinity, HelpCircle,
} from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    desc: 'For individuals getting started',
    monthlyPrice: 0,
    yearlyPrice: 0,
    icon: FileText,
    iconColor: '#6366f1',
    iconBg: '#eef2ff',
    badge: null,
    cta: 'Get started free',
    ctaVariant: 'outline' as const,
    features: [
      '5 workspaces',
      'Rich block editor (Notes, Kanban, Canvas)',
      '50+ pre-built templates',
      '3 AI cloud requests / day',
      'Local AI — fully offline',
      '1 collaborator per workspace',
      '7-day version history',
      'Community support',
    ],
    unavailable: [
      'Unlimited AI requests',
      'Team management',
      'SAML SSO',
      'Priority support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    desc: 'For power users who need more',
    monthlyPrice: 12,
    yearlyPrice: 96,
    icon: Zap,
    iconColor: '#8b5cf6',
    iconBg: '#f5f3ff',
    badge: 'Most popular',
    cta: 'Start Pro',
    ctaVariant: 'primary' as const,
    features: [
      'Unlimited workspaces',
      'Everything in Free',
      '200 AI cloud requests / day',
      'Priority AI processing',
      'Unlimited collaborators',
      'Advanced AI: Meeting intel, Journal insights',
      '90-day version history',
      'Custom subdomain',
      'Priority email support',
    ],
    unavailable: [
      'Team management',
      'SAML SSO',
    ],
  },
  {
    id: 'team',
    name: 'Team',
    desc: 'For teams that think together',
    monthlyPrice: 24,
    yearlyPrice: 192,
    perUser: true,
    icon: Users,
    iconColor: '#06b6d4',
    iconBg: '#ecfeff',
    badge: null,
    cta: 'Start Team trial',
    ctaVariant: 'outline' as const,
    features: [
      'Everything in Pro',
      'Unlimited AI requests',
      'Team workspace management',
      'Admin controls & audit logs',
      'SAML SSO',
      'Unlimited version history',
      'Dedicated onboarding',
      'SLA-backed support',
      'Custom integrations (API)',
    ],
    unavailable: [],
  },
];

const FAQS = [
  {
    q: 'Is the free plan really free forever?',
    a: 'Yes. The free plan has no time limit. You can use Likho with up to 5 workspaces and local AI indefinitely — no credit card required.',
  },
  {
    q: 'What counts as an "AI request"?',
    a: 'Each cloud AI action (writing assist, auto-tag, meeting extract, journal insights, etc.) counts as one request. Local AI via your own device is always unlimited and free.',
  },
  {
    q: 'Can I switch plans at any time?',
    a: 'Absolutely. You can upgrade, downgrade, or cancel at any point. Prorated credits are applied automatically when switching.',
  },
  {
    q: 'How does the Team plan billing work?',
    a: 'Team is billed per seat. You pay for each active member in your workspace. Annual billing saves ~33% compared to monthly.',
  },
  {
    q: 'Do you offer discounts for students or non-profits?',
    a: 'Yes — students, educators, and registered non-profits get 50% off Pro. Reach out to us at hello@likho.app with verification.',
  },
  {
    q: 'Is my data stored locally or in the cloud?',
    a: 'Both. Notes sync to our servers for collaboration and backup, but you can also use Likho fully offline with local-only storage in the desktop app.',
  },
];

const PricingCard = ({
  plan,
  yearly,
  index,
  isInView,
}: {
  plan: typeof PLANS[0];
  yearly: boolean;
  index: number;
  isInView: boolean;
}) => {
  const Icon = plan.icon;
  const price = yearly ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice;
  const isPrimary = plan.ctaVariant === 'primary';

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
      className="relative flex flex-col rounded-2xl"
      style={{
        backgroundColor: isPrimary ? '#09090b' : '#ffffff',
        border: isPrimary ? '1px solid #27272a' : '1px solid #e4e4e7',
        boxShadow: isPrimary
          ? '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.12)'
          : '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)',
      }}
    >
      {/* Popular badge */}
      {plan.badge && (
        <div
          className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#ffffff',
            boxShadow: '0 2px 8px rgba(99,102,241,0.4)',
          }}
        >
          <Sparkles className="w-3 h-3" />
          {plan.badge}
        </div>
      )}

      <div className="p-7 flex-1 flex flex-col">
        {/* Icon + plan name */}
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              backgroundColor: isPrimary ? 'rgba(255,255,255,0.08)' : plan.iconBg,
            }}
          >
            <Icon
              className="w-5 h-5"
              style={{ color: isPrimary ? '#ffffff' : plan.iconColor }}
            />
          </div>
          <div>
            <h3
              className="text-base font-bold"
              style={{ color: isPrimary ? '#fafafa' : '#09090b' }}
            >
              {plan.name}
            </h3>
            <p
              className="text-xs leading-snug"
              style={{ color: isPrimary ? '#71717a' : '#a1a1aa' }}
            >
              {plan.desc}
            </p>
          </div>
        </div>

        {/* Price */}
        <div className="mb-6">
          <div className="flex items-end gap-1.5">
            <span
              className="text-4xl font-black tracking-tight"
              style={{ color: isPrimary ? '#fafafa' : '#09090b' }}
            >
              {price === 0 ? 'Free' : `$${price}`}
            </span>
            {price !== 0 && (
              <span
                className="text-sm font-medium mb-1.5"
                style={{ color: isPrimary ? '#71717a' : '#a1a1aa' }}
              >
                / mo{plan.perUser ? ' / user' : ''}
              </span>
            )}
          </div>
          {yearly && plan.yearlyPrice > 0 && (
            <p className="text-xs mt-1" style={{ color: isPrimary ? '#71717a' : '#a1a1aa' }}>
              Billed ${plan.yearlyPrice}/yr — save{' '}
              <span style={{ color: isPrimary ? '#86efac' : '#16a34a', fontWeight: 600 }}>
                ${plan.monthlyPrice * 12 - plan.yearlyPrice}
              </span>
            </p>
          )}
        </div>

        {/* CTA */}
        <Link
          to="/auth/sign-up"
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-sm font-semibold mb-7 transition-all hover:opacity-90 active:scale-[0.98]"
          style={
            isPrimary
              ? { backgroundColor: '#ffffff', color: '#09090b' }
              : { backgroundColor: '#09090b', color: '#fafafa', boxShadow: '0 1px 3px rgba(0,0,0,0.18)' }
          }
        >
          {plan.cta}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>

        {/* Divider */}
        <div
          className="mb-6"
          style={{ borderTop: `1px solid ${isPrimary ? '#27272a' : '#f4f4f5'}` }}
        />

        {/* Features */}
        <ul className="space-y-3 flex-1">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-sm">
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{
                  backgroundColor: isPrimary ? 'rgba(34,197,94,0.15)' : '#f0fdf4',
                }}
              >
                <Check className="w-2.5 h-2.5" style={{ color: '#22c55e' }} />
              </div>
              <span style={{ color: isPrimary ? '#d4d4d8' : '#3f3f46' }}>{f}</span>
            </li>
          ))}
          {plan.unavailable.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-sm opacity-40">
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ backgroundColor: isPrimary ? '#3f3f46' : '#f4f4f5' }}
              >
                <span style={{ color: isPrimary ? '#71717a' : '#a1a1aa', fontSize: 9 }}>—</span>
              </div>
              <span style={{ color: isPrimary ? '#52525b' : '#a1a1aa' }}>{f}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
};

const PricingSection = () => {
  const [yearly, setYearly] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section
      ref={ref}
      id="pricing"
      className="py-24 lg:py-36 relative overflow-hidden"
      style={{ backgroundColor: '#ffffff' }}
    >
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
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.06) 0%, transparent 70%)',
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold mb-7 tracking-wide uppercase"
            style={{ backgroundColor: '#f5f3ff', color: '#8b5cf6', border: '1px solid #ddd6fe' }}
          >
            <Sparkles className="w-3 h-3" />
            Simple pricing
          </div>

          <h2
            className="font-black tracking-[-0.04em] leading-[0.92] mb-5"
            style={{ fontSize: 'clamp(2.4rem, 6vw, 4rem)' }}
          >
            <span style={{ color: '#a1a1aa', display: 'block', fontWeight: 800 }}>
              Start free.
            </span>
            <span style={{ color: '#09090b', display: 'block', fontWeight: 900 }}>
              Scale when ready.
            </span>
          </h2>

          <p className="text-lg mx-auto mb-10 leading-relaxed" style={{ color: '#71717a', maxWidth: '42ch' }}>
            No surprise fees, no hidden limits. Pick the plan that fits and upgrade whenever you're ready.
          </p>

          {/* Billing toggle */}
          <div
            className="inline-flex items-center gap-1 p-1 rounded-xl"
            style={{ backgroundColor: '#f4f4f5', border: '1px solid #e4e4e7' }}
          >
            {['Monthly', 'Yearly'].map((label) => {
              const isActive = (label === 'Yearly') === yearly;
              return (
                <button
                  key={label}
                  onClick={() => setYearly(label === 'Yearly')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    backgroundColor: isActive ? '#ffffff' : 'transparent',
                    color: isActive ? '#09090b' : '#71717a',
                    boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  {label}
                  {label === 'Yearly' && (
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: isActive ? '#f0fdf4' : '#dcfce7',
                        color: '#16a34a',
                      }}
                    >
                      Save 33%
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-20">
          {PLANS.map((plan, i) => (
            <PricingCard key={plan.id} plan={plan} yearly={yearly} index={i} isInView={isInView} />
          ))}
        </div>

        {/* Enterprise row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="rounded-2xl px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-5 mb-24"
          style={{
            backgroundColor: '#fafafa',
            border: '1px solid #e4e4e7',
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa' }}
            >
              <Building2 className="w-5 h-5" style={{ color: '#ea580c' }} />
            </div>
            <div>
              <h3 className="text-base font-bold" style={{ color: '#09090b' }}>Enterprise</h3>
              <p className="text-sm" style={{ color: '#71717a' }}>
                Custom contracts, dedicated infra, volume pricing, and white-glove onboarding.
              </p>
            </div>
          </div>
          <a
            href="mailto:enterprise@likho.app"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 flex-shrink-0"
            style={{
              backgroundColor: '#09090b',
              color: '#fafafa',
              boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
            }}
          >
            Contact sales
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </motion.div>

        {/* FAQ */}
        <FaqSection isInView={isInView} />
      </div>
    </section>
  );
};

const FaqSection = ({ isInView }: { isInView: boolean }) => {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="text-center mb-10"
      >
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#09090b' }}>
          Frequently asked questions
        </h2>
        <p className="text-sm" style={{ color: '#71717a' }}>
          Still have questions?{' '}
          <a href="mailto:hello@likho.app" style={{ color: '#6366f1', fontWeight: 600 }}>
            Write to us
          </a>
        </p>
      </motion.div>

      <div
        className="max-w-2xl mx-auto rounded-2xl overflow-hidden"
        style={{ border: '1px solid #e4e4e7' }}
      >
        {FAQS.map((faq, i) => (
          <div
            key={i}
            style={{ borderBottom: i < FAQS.length - 1 ? '1px solid #f4f4f5' : 'none' }}
          >
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between px-6 py-5 text-left transition-colors"
              style={{ backgroundColor: open === i ? '#fafafa' : '#ffffff' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fafafa'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = open === i ? '#fafafa' : '#ffffff'; }}
            >
              <span className="text-sm font-semibold pr-4" style={{ color: '#09090b' }}>
                {faq.q}
              </span>
              <HelpCircle
                className="w-4 h-4 flex-shrink-0 transition-transform"
                style={{
                  color: open === i ? '#6366f1' : '#a1a1aa',
                  transform: open === i ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
            </button>
            {open === i && (
              <div className="px-6 pb-5">
                <p className="text-sm leading-relaxed" style={{ color: '#71717a' }}>
                  {faq.a}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const Pricing = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={scrollContainerRef} className="h-full overflow-y-auto overflow-x-hidden scroll-smooth" style={{ backgroundColor: '#ffffff' }}>
      <Navbar scrollContainerRef={scrollContainerRef} />
      <main className="pt-16">
        {/* Hero */}
        <PricingHero />
        <PricingSection />
      </main>
      <Footer />
    </div>
  );
};

const PricingHero = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <section
      ref={ref}
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
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-8"
          initial={{ opacity: 0, y: -8 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4 }}
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
            <Sparkles className="w-2.5 h-2.5 text-white" />
          </div>
          Free to start — no credit card required
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="font-black tracking-[-0.04em] leading-[0.92] mb-6"
          style={{ fontSize: 'clamp(2.8rem, 8vw, 5rem)' }}
        >
          <span style={{ color: '#a1a1aa', display: 'block', fontWeight: 800 }}>Pricing that</span>
          <span style={{ color: '#09090b', display: 'block', fontWeight: 900 }}>makes sense.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-lg mx-auto leading-relaxed"
          style={{ color: '#71717a', maxWidth: '46ch' }}
        >
          Start free, stay free, or upgrade when your team grows. Every plan includes local AI and offline access.
        </motion.p>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 mt-8 text-sm"
          style={{ color: '#a1a1aa' }}
        >
          {['No credit card required', 'Cancel anytime', 'Local AI always free'].map((item) => (
            <div key={item} className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#22c55e' }} />
              <span>{item}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;
