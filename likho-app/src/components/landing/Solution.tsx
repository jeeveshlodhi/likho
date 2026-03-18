import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Rocket, Calendar, BookOpen, Layout, Brain, ArrowRight } from 'lucide-react';

const templates = [
  { name: 'Startup Planner', icon: Rocket, bg: '#fff7ed', color: '#ea580c', iconBg: '#fed7aa', tag: 'Popular' },
  { name: 'Meeting Notes', icon: Calendar, bg: '#eff6ff', color: '#2563eb', iconBg: '#bfdbfe', tag: null },
  { name: 'Daily Journal', icon: BookOpen, bg: '#f0fdf4', color: '#16a34a', iconBg: '#bbf7d0', tag: null },
  { name: 'Project Board', icon: Layout, bg: '#faf5ff', color: '#9333ea', iconBg: '#e9d5ff', tag: 'New' },
  { name: 'Second Brain', icon: Brain, bg: '#f0f9ff', color: '#0284c7', iconBg: '#bae6fd', tag: null },
];

const Solution = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section
      ref={ref}
      className="py-28 lg:py-36 relative overflow-hidden"
      style={{ backgroundColor: '#ffffff' }}
    >
      {/* Subtle bg glow on right */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 50% 60% at 80% 50%, rgba(22,163,74,0.04) 0%, transparent 70%)',
        }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.55 }}
          >
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold mb-7 tracking-wide uppercase"
              style={{ backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}
            >
              The solution
            </div>

            <h2
              className="font-bold tracking-tight mb-5 leading-[1.1]"
              style={{ color: '#09090b', fontSize: 'clamp(2rem, 4vw, 2.8rem)' }}
            >
              Start with{' '}
              <span style={{ color: '#16a34a' }}>ready workflows.</span>
            </h2>

            <p className="text-lg mb-10 leading-relaxed" style={{ color: '#71717a', maxWidth: '36ch' }}>
              Pick a template and jump straight into working. No blank page, no setup friction — just your ideas flowing.
            </p>

            <div className="space-y-4 mb-10">
              {[
                { label: '50+ templates', desc: 'For every workflow and team size' },
                { label: 'Instant setup', desc: 'Structure in place from the first click' },
                { label: 'Fully customizable', desc: 'Adapt any template to your exact needs' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.2 + i * 0.08, duration: 0.4 }}
                  className="flex items-center gap-3"
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: '#f0fdf4', border: '1.5px solid #86efac' }}
                  >
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <span className="text-sm font-semibold" style={{ color: '#09090b' }}>{item.label}</span>
                    <span className="text-sm" style={{ color: '#71717a' }}> — {item.desc}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            <button
              onClick={() => document.querySelector('#templates')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center gap-2 text-sm font-semibold transition-all group"
              style={{ color: '#09090b' }}
            >
              Browse all templates
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </motion.div>

          {/* Template grid */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="relative"
          >
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e4e4e7',
                boxShadow: '0 4px 6px rgba(0,0,0,0.03), 0 12px 32px rgba(0,0,0,0.06)',
              }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: '1px solid #f4f4f5' }}
              >
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: '#09090b' }}>Choose a template</h3>
                  <p className="text-xs mt-0.5" style={{ color: '#a1a1aa' }}>Start working in seconds</p>
                </div>
                <span
                  className="text-xs font-semibold px-2 py-1 rounded-lg"
                  style={{ backgroundColor: '#f4f4f5', color: '#71717a' }}
                >
                  50+ available
                </span>
              </div>

              {/* Search bar */}
              <div className="px-5 py-3" style={{ borderBottom: '1px solid #f4f4f5' }}>
                <div
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm"
                  style={{ backgroundColor: '#fafafa', border: '1px solid #e4e4e7', color: '#a1a1aa' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                  Search templates…
                </div>
              </div>

              {/* Template list */}
              <div className="p-3 grid grid-cols-2 gap-2">
                {templates.map((template, i) => {
                  const Icon = template.icon;
                  return (
                    <motion.div
                      key={template.name}
                      initial={{ opacity: 0, y: 12 }}
                      animate={isInView ? { opacity: 1, y: 0 } : {}}
                      transition={{ delay: 0.25 + i * 0.07, duration: 0.4 }}
                      whileHover={{ y: -2, transition: { duration: 0.15 } }}
                      className="group relative rounded-xl p-4 cursor-pointer transition-all"
                      style={{
                        backgroundColor: '#fafafa',
                        border: '1px solid #e4e4e7',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = template.bg;
                        e.currentTarget.style.borderColor = template.color + '40';
                        e.currentTarget.style.boxShadow = `0 2px 12px ${template.color}14`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#fafafa';
                        e.currentTarget.style.borderColor = '#e4e4e7';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {template.tag && (
                        <div
                          className="absolute top-2.5 right-2.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full tracking-wide uppercase"
                          style={{ backgroundColor: template.iconBg, color: template.color }}
                        >
                          {template.tag}
                        </div>
                      )}
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                        style={{ backgroundColor: template.iconBg }}
                      >
                        <Icon className="w-4.5 h-4.5" style={{ color: template.color, width: 18, height: 18 }} />
                      </div>
                      <h4 className="text-sm font-semibold" style={{ color: '#09090b' }}>{template.name}</h4>
                    </motion.div>
                  );
                })}
              </div>

              {/* Footer hint */}
              <div
                className="px-5 py-3.5 flex items-center justify-between"
                style={{ borderTop: '1px solid #f4f4f5' }}
              >
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.4, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: '#22c55e', boxShadow: '0 0 0 3px rgba(34,197,94,0.15)' }}
                  />
                  <span className="text-xs font-medium" style={{ color: '#71717a' }}>Ready in under 2 seconds</span>
                </div>
                <span className="text-xs" style={{ color: '#a1a1aa' }}>↵ to open</span>
              </div>
            </div>

            {/* Floating ready badge */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -bottom-5 -left-5 flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e4e4e7',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                color: '#3f3f46',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              Instant setup
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Solution;
