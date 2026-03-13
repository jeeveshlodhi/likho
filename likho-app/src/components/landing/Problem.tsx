import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
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
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section
      ref={ref}
      className="py-24 lg:py-32 relative overflow-hidden"
      style={{ backgroundColor: '#fafafa', borderTop: '1px solid #f3f4f6' }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Illustration */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="relative order-2 lg:order-1"
          >
            <div
              className="rounded-2xl p-6 overflow-hidden"
              style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
            >
              {/* Window chrome */}
              <div className="flex items-center gap-2 mb-5 pb-4" style={{ borderBottom: '1px solid #f3f4f6' }}>
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#fca5a5' }} />
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#fcd34d' }} />
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#86efac' }} />
                </div>
                <div className="h-5 rounded flex-1 mx-6" style={{ backgroundColor: '#f3f4f6' }} />
              </div>

              {/* Empty page state */}
              <div className="flex flex-col items-center justify-center py-14">
                <motion.div
                  animate={{ rotate: [0, -8, 8, -8, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2 }}
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: '#f3f4f6' }}
                >
                  <FileX className="w-8 h-8" style={{ color: '#d1d5db' }} />
                </motion.div>
                <div className="h-4 rounded-lg w-48 mb-2.5" style={{ backgroundColor: '#f3f4f6' }} />
                <div className="h-3 rounded-lg w-32" style={{ backgroundColor: '#f9fafb' }} />

                {/* Blinking cursor */}
                <motion.div
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.9, repeat: Infinity }}
                  className="mt-8 h-5 w-0.5 rounded"
                  style={{ backgroundColor: '#d1d5db' }}
                />
              </div>

              {/* Toolbar row */}
              <div className="flex gap-2 mt-3 pt-4" style={{ borderTop: '1px solid #f3f4f6' }}>
                {[64, 48, 56, 80].map((w, i) => (
                  <div key={i} className="h-7 rounded-lg" style={{ backgroundColor: '#f3f4f6', width: w }} />
                ))}
              </div>
            </div>

            {/* Floating badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="absolute -top-3 -right-3 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium"
              style={{
                backgroundColor: '#fff7ed',
                border: '1px solid #fed7aa',
                color: '#c2410c',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Where do I start?
            </motion.div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="order-1 lg:order-2"
          >
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-6"
              style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
            >
              The problem
            </div>

            <h2
              className="text-4xl lg:text-5xl font-bold tracking-tight mb-5 leading-tight"
              style={{ color: '#111827' }}
            >
              Most tools start with an{' '}
              <span style={{ color: '#9ca3af' }}>empty page</span>.
            </h2>

            <p className="text-lg mb-8" style={{ color: '#6b7280' }}>
              You open a new workspace and spend more time setting things up than actually doing work.
            </p>

            <div className="space-y-4">
              {painPoints.map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                    className="flex items-center gap-3"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: '#fef2f2' }}
                    >
                      <Icon className="w-4 h-4" style={{ color: '#f87171' }} />
                    </div>
                    <span className="text-sm" style={{ color: '#374151' }}>{item.text}</span>
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
