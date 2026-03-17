import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { FileText, Heading1, List, CheckSquare, Image, Code, Quote, Slash } from 'lucide-react';

const blockTypes = [
  { icon: Heading1, label: 'Heading', bg: '#eff6ff', color: '#2563eb' },
  { icon: List, label: 'List', bg: '#faf5ff', color: '#9333ea' },
  { icon: CheckSquare, label: 'Todo', bg: '#f0fdf4', color: '#16a34a' },
  { icon: Image, label: 'Image', bg: '#fdf2f8', color: '#db2777' },
  { icon: Code, label: 'Code', bg: '#fff7ed', color: '#ea580c' },
  { icon: Quote, label: 'Quote', bg: '#fefce8', color: '#ca8a04' },
];

const features = [
  { label: 'Slash commands', desc: 'Type / for quick blocks', comingSoon: false },
  { label: 'Markdown support', desc: 'Write in your natural style', comingSoon: false },
  { label: 'Drag & drop', desc: 'Reorder blocks with ease', comingSoon: false },
  { label: 'AI assistance', desc: 'Smart writing suggestions', comingSoon: true },
];

const FeatureNotes = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section
      ref={ref}
      id="features"
      className="py-24 lg:py-32 relative overflow-hidden"
      style={{ backgroundColor: '#fafafa', borderTop: '1px solid #f3f4f6' }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Editor mockup */}
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
                className="flex items-center gap-1.5 px-4 py-3 border-b"
                style={{ borderColor: '#f3f4f6', backgroundColor: '#fafafa' }}
              >
                {blockTypes.slice(0, 5).map((block) => {
                  const Icon = block.icon;
                  return (
                    <div
                      key={block.label}
                      className="p-1.5 rounded-lg cursor-pointer transition-opacity hover:opacity-80"
                      style={{ backgroundColor: block.bg }}
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color: block.color }} />
                    </div>
                  );
                })}
                <div className="flex-1" />
                <span className="text-xs" style={{ color: '#9ca3af' }}>Saved just now</span>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : {}}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="space-y-2"
                >
                  <div className="h-7 rounded-lg w-3/4" style={{ backgroundColor: '#f3f4f6' }} />
                  <div className="h-4 rounded w-full" style={{ backgroundColor: '#f9fafb' }} />
                  <div className="h-4 rounded w-5/6" style={{ backgroundColor: '#f9fafb' }} />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.45, duration: 0.5 }}
                  className="flex items-center gap-3"
                >
                  <div
                    className="w-4.5 h-4.5 rounded flex items-center justify-center flex-shrink-0"
                    style={{ width: 18, height: 18, border: '2px solid #16a34a' }}
                  >
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#16a34a' }} />
                  </div>
                  <div className="h-4 rounded flex-1" style={{ backgroundColor: '#dcfce7' }} />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.55, duration: 0.5 }}
                  className="flex items-center gap-3"
                >
                  <div
                    className="rounded flex-shrink-0"
                    style={{ width: 18, height: 18, border: '2px solid #d1d5db' }}
                  />
                  <div className="h-4 rounded flex-1" style={{ backgroundColor: '#f3f4f6' }} />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : {}}
                  transition={{ delay: 0.65, duration: 0.5 }}
                  className="pl-4 py-2"
                  style={{ borderLeft: '3px solid #fcd34d' }}
                >
                  <div className="h-3 rounded mb-1.5" style={{ backgroundColor: '#fef9c3' }} />
                  <div className="h-3 rounded w-4/5" style={{ backgroundColor: '#fef9c3' }} />
                </motion.div>

                {/* Slash command menu */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  className="rounded-xl p-2 max-w-xs"
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                  }}
                >
                  <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
                    <Slash className="w-3 h-3" style={{ color: '#9ca3af' }} />
                    <span className="text-xs" style={{ color: '#9ca3af' }}>Blocks</span>
                  </div>
                  {blockTypes.slice(0, 4).map((block, i) => {
                    const Icon = block.icon;
                    return (
                      <div
                        key={block.label}
                        className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs"
                        style={{
                          backgroundColor: i === 0 ? '#eff6ff' : 'transparent',
                          color: i === 0 ? '#2563eb' : '#374151',
                        }}
                      >
                        <div
                          className="w-6 h-6 rounded flex items-center justify-center"
                          style={{ backgroundColor: block.bg }}
                        >
                          <Icon className="w-3.5 h-3.5" style={{ color: block.color }} />
                        </div>
                        {block.label}
                      </div>
                    );
                  })}
                </motion.div>
              </div>
            </div>

            {/* Floating block palette */}
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
              {blockTypes.map((block) => {
                const Icon = block.icon;
                return (
                  <div
                    key={block.label}
                    className="p-1.5 rounded-lg"
                    style={{ backgroundColor: block.bg }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: block.color }} />
                  </div>
                );
              })}
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
              style={{ backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}
            >
              <FileText className="w-3.5 h-3.5" />
              Notes
            </div>

            <h2
              className="text-4xl lg:text-5xl font-bold tracking-tight mb-5 leading-tight"
              style={{ color: '#111827' }}
            >
              Write notes without{' '}
              <span style={{ color: '#2563eb' }}>friction</span>.
            </h2>

            <p className="text-lg mb-8" style={{ color: '#6b7280' }}>
              A block-based editor designed for thinking. Organize ideas with simple building blocks instead of complex formatting.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.4 + i * 0.08, duration: 0.5 }}
                  className="relative p-4 rounded-xl"
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    opacity: feature.comingSoon ? 0.65 : 1,
                  }}
                >
                  {feature.comingSoon && (
                    <span
                      className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{ backgroundColor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}
                    >
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      Soon
                    </span>
                  )}
                  <h4 className="text-sm font-semibold mb-1" style={{ color: feature.comingSoon ? '#9ca3af' : '#111827' }}>
                    {feature.label}
                  </h4>
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

export default FeatureNotes;
