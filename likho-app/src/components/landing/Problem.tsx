import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { FileX, Timer, Layers, AlertCircle } from 'lucide-react';

const painPoints = [
  { icon: FileX, text: 'Start from a blank page every single time' },
  { icon: Timer, text: 'Spend hours setting up instead of doing the actual work' },
  { icon: Layers, text: 'Copy-paste templates from random websites and reformat' },
  { icon: AlertCircle, text: 'Lose momentum before you even begin thinking' },
];

const Problem = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section
      ref={ref}
      className="py-28 lg:py-36 relative overflow-hidden"
      style={{ backgroundColor: '#fafafa', borderTop: '1px solid #f4f4f5' }}
    >
      {/* Subtle radial bg */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 20% 50%, rgba(239,68,68,0.04) 0%, transparent 70%)',
        }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Illustration */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.55 }}
            className="relative order-2 lg:order-1"
          >
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e4e4e7',
                boxShadow: '0 4px 6px rgba(0,0,0,0.03), 0 12px 32px rgba(0,0,0,0.06)',
              }}
            >
              {/* Window chrome */}
              <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid #f4f4f5' }}>
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#fca5a5' }} />
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#fcd34d' }} />
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#86efac' }} />
                </div>
                <div className="h-5 rounded-md flex-1 mx-6" style={{ backgroundColor: '#f4f4f5' }} />
              </div>

              {/* Empty page state */}
              <div className="flex flex-col items-center justify-center py-16 px-8">
                <motion.div
                  animate={{ rotate: [0, -6, 6, -6, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2.5 }}
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: '#f4f4f5' }}
                >
                  <FileX className="w-8 h-8" style={{ color: '#d4d4d8' }} />
                </motion.div>
                <div className="h-3.5 rounded-lg w-48 mb-2.5" style={{ backgroundColor: '#f4f4f5' }} />
                <div className="h-3 rounded-lg w-32 mb-1" style={{ backgroundColor: '#fafafa' }} />
                <div className="h-3 rounded-lg w-24" style={{ backgroundColor: '#fafafa' }} />

                {/* Blinking cursor */}
                <motion.div
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.85, repeat: Infinity }}
                  className="mt-8 h-5 w-0.5 rounded-full"
                  style={{ backgroundColor: '#d4d4d8' }}
                />
              </div>

              {/* Toolbar row */}
              <div className="flex gap-2 px-5 pb-4 pt-2" style={{ borderTop: '1px solid #f4f4f5' }}>
                {[72, 56, 64, 88].map((w, i) => (
                  <div key={i} className="h-7 rounded-lg" style={{ backgroundColor: '#f4f4f5', width: w }} />
                ))}
              </div>
            </div>

            {/* Floating badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 8 }}
              animate={isInView ? { opacity: 1, scale: 1, y: 0 } : {}}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="absolute -top-4 -right-4 flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold"
              style={{
                backgroundColor: '#fff7ed',
                border: '1px solid #fed7aa',
                color: '#c2410c',
                boxShadow: '0 4px 16px rgba(194,65,12,0.12)',
              }}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Where do I even start?
            </motion.div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="order-1 lg:order-2"
          >
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold mb-7 tracking-wide uppercase"
              style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
            >
              The problem
            </div>

            <h2
              className="font-bold tracking-tight mb-5 leading-[1.1]"
              style={{ color: '#09090b', fontSize: 'clamp(2rem, 4vw, 2.8rem)' }}
            >
              Most tools start you with{' '}
              <span
                style={{
                  background: 'linear-gradient(90deg, #a1a1aa, #d4d4d8)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                nothing.
              </span>
            </h2>

            <p className="text-lg mb-10 leading-relaxed" style={{ color: '#71717a', maxWidth: '38ch' }}>
              You open a new workspace and spend more time setting up structure than actually doing the work.
            </p>

            <div className="space-y-3">
              {painPoints.map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 16 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.28 + i * 0.08, duration: 0.45 }}
                    className="flex items-center gap-3 py-3 px-4 rounded-xl"
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #f4f4f5',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: '#fef2f2' }}
                    >
                      <Icon className="w-4 h-4" style={{ color: '#f87171' }} />
                    </div>
                    <span className="text-sm font-medium" style={{ color: '#3f3f46' }}>{item.text}</span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Problem;
