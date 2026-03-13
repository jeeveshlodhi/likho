import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Rocket, Calendar, BookOpen, Layout, Brain, ArrowRight } from 'lucide-react';

const templates = [
  { name: 'Startup Planner', icon: Rocket, bg: '#fff7ed', color: '#ea580c', tag: 'Popular' },
  { name: 'Meeting Notes', icon: Calendar, bg: '#eff6ff', color: '#2563eb', tag: null },
  { name: 'Daily Journal', icon: BookOpen, bg: '#f0fdf4', color: '#16a34a', tag: null },
  { name: 'Project Board', icon: Layout, bg: '#faf5ff', color: '#9333ea', tag: 'New' },
  { name: 'Second Brain', icon: Brain, bg: '#f0f9ff', color: '#0284c7', tag: null },
];

const Solution = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section
      ref={ref}
      className="py-24 lg:py-32 relative overflow-hidden"
      style={{ backgroundColor: '#ffffff' }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-6"
              style={{ backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}
            >
              The solution
            </div>

            <h2
              className="text-4xl lg:text-5xl font-bold tracking-tight mb-5 leading-tight"
              style={{ color: '#111827' }}
            >
              Start with{' '}
              <span style={{ color: '#16a34a' }}>ready workflows</span>.
            </h2>

            <p className="text-lg mb-8" style={{ color: '#6b7280' }}>
              Choose a template and jump straight into working. No setup, no friction — just your ideas flowing.
            </p>

            <button
              onClick={() => document.querySelector('#templates')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center gap-2 text-sm font-semibold transition-all group"
              style={{ color: '#111827' }}
            >
              Browse all templates
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </motion.div>

          {/* Template grid */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative"
          >
            <div
              className="rounded-2xl p-6"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
              }}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-semibold" style={{ color: '#111827' }}>Choose a template</h3>
                <span className="text-xs" style={{ color: '#9ca3af' }}>50+ available</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {templates.map((template, i) => {
                  const Icon = template.icon;
                  return (
                    <motion.div
                      key={template.name}
                      initial={{ opacity: 0, y: 16 }}
                      animate={isInView ? { opacity: 1, y: 0 } : {}}
                      transition={{ delay: 0.25 + i * 0.08, duration: 0.5 }}
                      whileHover={{ y: -2 }}
                      className="group relative rounded-xl p-4 cursor-pointer transition-all"
                      style={{
                        backgroundColor: '#fafafa',
                        border: '1px solid #e5e7eb',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = template.color + '55';
                        e.currentTarget.style.boxShadow = `0 2px 12px ${template.color}18`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {template.tag && (
                        <div
                          className="absolute top-2.5 right-2.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: template.bg, color: template.color }}
                        >
                          {template.tag}
                        </div>
                      )}
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                        style={{ backgroundColor: template.bg }}
                      >
                        <Icon className="w-4.5 h-4.5" style={{ color: template.color, width: 18, height: 18 }} />
                      </div>
                      <h4 className="text-sm font-medium" style={{ color: '#111827' }}>{template.name}</h4>
                    </motion.div>
                  );
                })}
              </div>

              {/* Pulse indicator */}
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute top-8 right-8 w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: '#22c55e', boxShadow: '0 0 0 4px rgba(34,197,94,0.15)' }}
              />
            </div>

            {/* Floating badge */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -bottom-4 -left-4 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                color: '#374151',
              }}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#22c55e' }} />
              Ready in 2 seconds
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Solution;
