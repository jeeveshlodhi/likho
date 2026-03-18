import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Link } from 'react-router';
import { ArrowRight, CheckCircle2, Download } from 'lucide-react';
import { useDesktopDownload } from '@/hooks/useDesktopDownload';
import { isTauri } from '@/utils/platform';

const FinalCTA = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const desktopRelease = useDesktopDownload();

  return (
    <section
      ref={ref}
      className="py-28 lg:py-40 relative overflow-hidden"
      style={{ backgroundColor: '#fafafa', borderTop: '1px solid #f4f4f5' }}
    >
      {/* Dot pattern — radial halftone */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #d4d4d8 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />
      {/* Center fade: white center, visible dots at edges */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(250,250,250,1) 0%, rgba(250,250,250,0.85) 45%, rgba(250,250,250,0.2) 80%, rgba(250,250,250,0) 100%)',
        }}
      />

      {/* Soft indigo glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.07) 0%, transparent 70%)',
        }}
      />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-10 tracking-wide"
            style={{
              backgroundColor: '#ffffff',
              color: '#71717a',
              border: '1px solid #e4e4e7',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: '#22c55e', boxShadow: '0 0 0 2px rgba(34,197,94,0.2)' }}
            />
            Free to get started — no credit card needed
          </div>

          {/* Heading */}
          <h2
            className="font-black tracking-[-0.04em] leading-[0.92] mb-6"
            style={{ fontSize: 'clamp(2.5rem, 7vw, 4.5rem)' }}
          >
            <span style={{ color: '#a1a1aa', display: 'block', fontWeight: 800 }}>
              Stop setting up.
            </span>
            <span style={{ color: '#09090b', display: 'block', fontWeight: 900 }}>
              Start building ideas.
            </span>
          </h2>

          <p
            className="text-lg mb-12 mx-auto leading-relaxed"
            style={{ color: '#71717a', maxWidth: '42ch' }}
          >
            Join thousands of thinkers already using Likho to bring their ideas to life — with AI, templates, and real-time collaboration built in.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12 flex-wrap">
            <Link
              to="/auth/sign-up"
              className="inline-flex items-center gap-2.5 px-7 py-3.5 text-base font-semibold rounded-xl transition-all hover:opacity-90 active:scale-[0.98] group"
              style={{
                backgroundColor: '#09090b',
                color: '#fafafa',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.08)',
              }}
            >
              Start using Likho
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>

            {desktopRelease && !isTauri() && (
              <a
                href={desktopRelease.download_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 text-base font-semibold rounded-xl transition-all active:scale-[0.98]"
                style={{
                  backgroundColor: '#ffffff',
                  color: '#3f3f46',
                  border: '1px solid #e4e4e7',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#d4d4d8';
                  e.currentTarget.style.backgroundColor = '#fafafa';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e4e4e7';
                  e.currentTarget.style.backgroundColor = '#ffffff';
                }}
              >
                <Download className="w-4 h-4" />
                Download Desktop
              </a>
            )}

            <button
              onClick={() => document.querySelector('#templates')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center gap-2.5 px-7 py-3.5 text-base font-semibold rounded-xl transition-all active:scale-[0.98]"
              style={{
                backgroundColor: '#ffffff',
                color: '#71717a',
                border: '1px solid #e4e4e7',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f4f4f5';
                e.currentTarget.style.color = '#3f3f46';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.color = '#71717a';
              }}
            >
              Explore templates
            </button>
          </div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm"
            style={{ color: '#a1a1aa' }}
          >
            {['No credit card required', 'Free forever plan', 'Works offline with local AI'].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#22c55e' }} />
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
