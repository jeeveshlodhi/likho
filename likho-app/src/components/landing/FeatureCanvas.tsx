import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Palette, MousePointer2, Hand, ZoomIn, Square, Type, Circle } from 'lucide-react';

const nodes = [
  { label: 'Vision', x: 10, y: 12, w: 26, h: 18, bg: '#ede9fe', color: '#7c3aed', border: '#ddd6fe' },
  { label: 'Strategy', x: 52, y: 8, w: 28, h: 18, bg: '#dbeafe', color: '#1d4ed8', border: '#bfdbfe' },
  { label: 'Execute', x: 30, y: 52, w: 30, h: 20, bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' },
  { label: 'Ship', x: 70, y: 48, w: 22, h: 16, bg: '#fef9c3', color: '#a16207', border: '#fde68a' },
];

const FeatureCanvas = () => {
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
          {/* Canvas mockup */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
              }}
            >
              {/* Toolbar */}
              <div
                className="flex items-center justify-between px-4 py-2.5 border-b"
                style={{ borderColor: '#f3f4f6', backgroundColor: '#fafafa' }}
              >
                <div className="flex items-center gap-1">
                  {[MousePointer2, Hand, Type, Square, Circle].map((Icon, i) => (
                    <button
                      key={i}
                      className="p-1.5 rounded-lg transition-colors"
                      style={{
                        backgroundColor: i === 0 ? '#f3f4f6' : 'transparent',
                        color: i === 0 ? '#111827' : '#9ca3af',
                      }}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <ZoomIn className="w-3.5 h-3.5" style={{ color: '#9ca3af' }} />
                  <span className="text-xs" style={{ color: '#9ca3af' }}>100%</span>
                </div>
              </div>

              {/* Canvas area */}
              <div
                className="relative h-72 overflow-hidden"
                style={{
                  backgroundColor: '#f9fafb',
                  backgroundImage: `
                    linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                    linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                  `,
                  backgroundSize: '24px 24px',
                }}
              >
                {/* SVG connections */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <motion.line
                    x1="23%" y1="21%" x2="52%" y2="17%"
                    stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="5 3"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={isInView ? { pathLength: 1, opacity: 1 } : {}}
                    transition={{ delay: 0.5, duration: 0.7 }}
                  />
                  <motion.line
                    x1="52%" y1="26%" x2="45%" y2="52%"
                    stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="5 3"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={isInView ? { pathLength: 1, opacity: 1 } : {}}
                    transition={{ delay: 0.65, duration: 0.7 }}
                  />
                  <motion.line
                    x1="60%" y1="62%" x2="70%" y2="56%"
                    stroke="#86efac" strokeWidth="1.5" strokeDasharray="5 3"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={isInView ? { pathLength: 1, opacity: 1 } : {}}
                    transition={{ delay: 0.8, duration: 0.7 }}
                  />
                </svg>

                {/* Nodes */}
                {nodes.map((node, i) => (
                  <motion.div
                    key={node.label}
                    className="absolute rounded-xl flex items-center justify-center text-xs font-semibold cursor-move shadow-sm"
                    style={{
                      left: `${node.x}%`,
                      top: `${node.y}%`,
                      width: `${node.w}%`,
                      height: `${node.h}%`,
                      backgroundColor: node.bg,
                      border: `1px solid ${node.border}`,
                      color: node.color,
                    }}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ delay: i * 0.12, duration: 0.4, type: 'spring', stiffness: 200 }}
                    whileHover={{ scale: 1.04, zIndex: 10 }}
                  >
                    {node.label}
                  </motion.div>
                ))}

                {/* Animated cursor */}
                <motion.div
                  animate={{ x: [40, 130, 180, 90, 40], y: [60, 45, 100, 130, 60] }}
                  transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute pointer-events-none"
                >
                  <MousePointer2 className="w-4 h-4" style={{ color: '#6366f1', fill: 'rgba(99,102,241,0.15)' }} />
                </motion.div>
              </div>
            </div>

            {/* Floating tools badge */}
            <motion.div
              animate={{ y: [0, -7, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-3 -right-3 flex gap-1.5 p-2 rounded-xl"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
            >
              {[{ Icon: Type, bg: '#eff6ff', color: '#2563eb' }, { Icon: Square, bg: '#faf5ff', color: '#9333ea' }].map(({ Icon, bg, color }, i) => (
                <div key={i} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: bg }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-6"
              style={{ backgroundColor: '#fdf2f8', color: '#db2777', border: '1px solid #fbcfe8' }}
            >
              <Palette className="w-3.5 h-3.5" />
              Canvas
            </div>

            <h2
              className="text-4xl lg:text-5xl font-bold tracking-tight mb-5 leading-tight"
              style={{ color: '#111827' }}
            >
              Think freely on a{' '}
              <span style={{ color: '#db2777' }}>visual canvas</span>.
            </h2>

            <p className="text-lg mb-8" style={{ color: '#6b7280' }}>
              Sketch ideas, connect thoughts, and build mind maps on an infinite canvas.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Infinite canvas', desc: 'No boundaries to your thinking' },
                { label: 'Connect ideas', desc: 'Draw links between concepts' },
                { label: 'Shape library', desc: 'Quick visual elements' },
                { label: 'Export & share', desc: 'PNG, SVG, PDF formats' },
              ].map((feature, i) => (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.4 + i * 0.08, duration: 0.5 }}
                  className="p-4 rounded-xl"
                  style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}
                >
                  <h4 className="text-sm font-semibold mb-1" style={{ color: '#111827' }}>{feature.label}</h4>
                  <p className="text-xs" style={{ color: '#6b7280' }}>{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FeatureCanvas;
