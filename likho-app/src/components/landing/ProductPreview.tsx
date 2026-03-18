import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Sparkles, FileText, LayoutGrid, Palette, Zap } from 'lucide-react';

const ProductPreview = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section
      ref={ref}
      className="py-24 lg:py-32 relative overflow-hidden"
      style={{ backgroundColor: '#ffffff' }}
    >
      {/* Soft gradient tint */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(99,102,241,0.05) 0%, transparent 70%)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2
            className="font-bold tracking-tight mb-5 leading-tight"
            style={{ color: '#09090b', fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}
          >
            A workspace for{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              thinking
            </span>
            .
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: '#71717a' }}>
            Everything you need to capture ideas, plan projects, and bring your vision to life.
          </p>
        </motion.div>

        {/* Main Preview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative"
        >
          <div
            className="relative rounded-2xl p-4 lg:p-6"
            style={{
              backgroundColor: '#f4f4f5',
              border: '1px solid #e4e4e7',
              boxShadow: '0 4px 6px rgba(0,0,0,0.03), 0 12px 40px rgba(0,0,0,0.07)',
            }}
          >
            {/* App Header */}
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                  >
                    <span className="text-white text-sm font-bold">L</span>
                  </div>
                  <span className="font-semibold" style={{ color: '#09090b' }}>Likho</span>
                </div>
                <div className="hidden sm:flex items-center gap-1 text-sm" style={{ color: '#a1a1aa' }}>
                  <span>Workspace</span>
                  <span>/</span>
                  <span style={{ color: '#3f3f46' }}>Product Launch</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg"
                  style={{ backgroundColor: '#eef2ff', border: '1px solid #c7d2fe' }}
                >
                  <Zap className="w-3.5 h-3.5" style={{ color: '#6366f1' }} />
                  <span className="text-xs font-semibold" style={{ color: '#6366f1' }}>AI Active</span>
                </div>
                <div className="flex -space-x-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: '#6366f1', border: '2px solid #f4f4f5' }}>A</div>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: '#8b5cf6', border: '2px solid #f4f4f5' }}>B</div>
                </div>
              </div>
            </div>

            {/* Workspace Grid */}
            <div className="grid lg:grid-cols-3 gap-4">
              {/* Notes Panel */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="rounded-xl overflow-hidden"
                style={{ backgroundColor: '#ffffff', border: '1px solid #e4e4e7' }}
              >
                <div
                  className="flex items-center gap-2 px-4 py-3"
                  style={{ borderBottom: '1px solid #f4f4f5', backgroundColor: '#fafafa' }}
                >
                  <FileText className="w-4 h-4" style={{ color: '#6366f1' }} />
                  <span className="text-sm font-semibold" style={{ color: '#09090b' }}>Launch Notes</span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="h-2.5 rounded w-3/4" style={{ backgroundColor: '#e4e4e7' }} />
                  <div className="h-2 rounded w-full" style={{ backgroundColor: '#f4f4f5' }} />
                  <div className="h-2 rounded w-5/6" style={{ backgroundColor: '#f4f4f5' }} />
                  <div className="h-2 rounded w-full" style={{ backgroundColor: '#f4f4f5' }} />
                  <div className="pt-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: '#22c55e', backgroundColor: '#f0fdf4' }}>
                        <motion.div
                          animate={{ scale: [0, 1] }}
                          transition={{ delay: 1.5, duration: 0.3 }}
                          className="w-2 h-2 rounded-sm"
                          style={{ backgroundColor: '#22c55e' }}
                        />
                      </div>
                      <div className="flex-1 h-2 rounded" style={{ backgroundColor: '#dcfce7' }} />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded border-2 flex-shrink-0" style={{ borderColor: '#d4d4d8' }} />
                      <div className="flex-1 h-2 rounded" style={{ backgroundColor: '#f4f4f5' }} />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Kanban Panel */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="rounded-xl overflow-hidden"
                style={{ backgroundColor: '#ffffff', border: '1px solid #e4e4e7' }}
              >
                <div
                  className="flex items-center gap-2 px-4 py-3"
                  style={{ borderBottom: '1px solid #f4f4f5', backgroundColor: '#fafafa' }}
                >
                  <LayoutGrid className="w-4 h-4" style={{ color: '#8b5cf6' }} />
                  <span className="text-sm font-semibold" style={{ color: '#09090b' }}>Tasks</span>
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 text-xs font-semibold" style={{ color: '#a1a1aa' }}>Todo</div>
                    <div className="flex-1 text-xs font-semibold" style={{ color: '#a1a1aa' }}>Done</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <motion.div
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      className="rounded-lg p-2"
                      style={{ backgroundColor: '#eef2ff', border: '1px solid #c7d2fe' }}
                    >
                      <div className="h-1.5 rounded w-full mb-1" style={{ backgroundColor: '#a5b4fc' }} />
                      <div className="h-1 rounded w-2/3" style={{ backgroundColor: '#c7d2fe' }} />
                    </motion.div>
                    <div className="rounded-lg p-2" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                      <div className="h-1.5 rounded w-full mb-1" style={{ backgroundColor: '#86efac' }} />
                      <div className="h-1 rounded w-3/4" style={{ backgroundColor: '#bbf7d0' }} />
                    </div>
                    <div className="rounded-lg p-2" style={{ backgroundColor: '#fafafa', border: '1px solid #e4e4e7' }}>
                      <div className="h-1.5 rounded w-5/6 mb-1" style={{ backgroundColor: '#e4e4e7' }} />
                      <div className="h-1 rounded w-1/2" style={{ backgroundColor: '#f4f4f5' }} />
                    </div>
                    <div className="rounded-lg p-2" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                      <div className="h-1.5 rounded w-full" style={{ backgroundColor: '#86efac' }} />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Canvas Panel */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="rounded-xl overflow-hidden"
                style={{ backgroundColor: '#ffffff', border: '1px solid #e4e4e7' }}
              >
                <div
                  className="flex items-center gap-2 px-4 py-3"
                  style={{ borderBottom: '1px solid #f4f4f5', backgroundColor: '#fafafa' }}
                >
                  <Palette className="w-4 h-4" style={{ color: '#ec4899' }} />
                  <span className="text-sm font-semibold" style={{ color: '#09090b' }}>Vision Board</span>
                </div>
                <div className="p-3 h-48 relative" style={{ backgroundColor: '#fafafa' }}>
                  <svg className="absolute inset-0 w-full h-full">
                    <motion.line
                      x1="20%" y1="30%" x2="60%" y2="20%"
                      stroke="#a5b4fc"
                      strokeWidth="1.5"
                      initial={{ pathLength: 0 }}
                      animate={isInView ? { pathLength: 1 } : {}}
                      transition={{ delay: 1, duration: 0.8 }}
                    />
                    <motion.line
                      x1="60%" y1="20%" x2="40%" y2="70%"
                      stroke="#d8b4fe"
                      strokeWidth="1.5"
                      initial={{ pathLength: 0 }}
                      animate={isInView ? { pathLength: 1 } : {}}
                      transition={{ delay: 1.2, duration: 0.8 }}
                    />
                  </svg>
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute top-4 left-4 w-16 h-12 rounded-lg"
                    style={{ backgroundColor: '#eef2ff', border: '1px solid #c7d2fe' }}
                  />
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                    className="absolute top-3 right-8 w-14 h-10 rounded-lg"
                    style={{ backgroundColor: '#f5f3ff', border: '1px solid #ddd6fe' }}
                  />
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                    className="absolute bottom-8 left-8 w-20 h-14 rounded-lg"
                    style={{ backgroundColor: '#fdf2f8', border: '1px solid #fbcfe8' }}
                  />
                </div>
              </motion.div>
            </div>

            {/* Floating Badge */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-4 right-8 rounded-xl p-3"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e4e4e7',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              }}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" style={{ color: '#f59e0b' }} />
                <span className="text-sm font-semibold" style={{ color: '#09090b' }}>Templates ready</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ProductPreview;
