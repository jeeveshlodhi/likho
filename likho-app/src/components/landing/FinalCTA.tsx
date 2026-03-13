import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Link } from 'react-router';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const FinalCTA = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section
      ref={ref}
      className="py-24 lg:py-32 relative overflow-hidden"
      style={{
        backgroundColor: '#111827',
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: '22px 22px',
      }}
    >
      {/* Subtle glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(99,102,241,0.12) 0%, transparent 70%)',
        }}
      />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-8"
            style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#d1d5db', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            Free to get started
          </div>

          <h2
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-5 leading-tight"
            style={{ color: '#ffffff' }}
          >
            Stop setting up.
            <br />
            <span style={{ color: '#a5b4fc' }}>Start building ideas.</span>
          </h2>

          <p className="text-lg mb-10" style={{ color: '#9ca3af' }}>
            Join thousands of thinkers who are already using Likho to bring their ideas to life.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
            <Link
              to="/auth/sign-up"
              className="inline-flex items-center gap-2 px-7 py-3.5 text-base font-semibold rounded-xl transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#ffffff', color: '#111827' }}
            >
              Start using Likho
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => document.querySelector('#templates')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center gap-2 px-7 py-3.5 text-base font-semibold rounded-xl transition-colors"
              style={{
                backgroundColor: 'transparent',
                color: '#d1d5db',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              Explore templates
            </button>
          </div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-6 text-sm"
            style={{ color: '#6b7280' }}
          >
            {['No credit card required', 'Free forever plan', 'Cancel anytime'].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" style={{ color: '#4ade80' }} />
                <span>{item}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default FinalCTA;
