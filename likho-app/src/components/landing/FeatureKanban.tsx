import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { LayoutGrid, Calendar, MoreHorizontal, Plus, Tag } from 'lucide-react';

const columns = [
  {
    name: 'To Do',
    dotColor: '#6b7280',
    bg: '#f9fafb',
    border: '#e5e7eb',
    cards: [
      { title: 'Research competitors', tag: 'Research', tagBg: '#eff6ff', tagColor: '#2563eb', date: 'Today' },
      { title: 'Draft landing page', tag: 'Design', tagBg: '#faf5ff', tagColor: '#9333ea', date: 'Tomorrow' },
    ],
  },
  {
    name: 'In Progress',
    dotColor: '#3b82f6',
    bg: '#eff6ff',
    border: '#bfdbfe',
    cards: [
      { title: 'Design system v2', tag: 'Dev', tagBg: '#f0fdf4', tagColor: '#16a34a', date: 'In 2 days' },
    ],
  },
  {
    name: 'Done',
    dotColor: '#22c55e',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    cards: [
      { title: 'User interviews', tag: 'Research', tagBg: '#eff6ff', tagColor: '#2563eb', date: 'Yesterday' },
    ],
  },
];

const FeatureKanban = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section
      ref={ref}
      className="py-24 lg:py-32 relative overflow-hidden"
      style={{ backgroundColor: '#ffffff', borderTop: '1px solid #f3f4f6' }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="order-2 lg:order-1"
          >
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-6"
              style={{ backgroundColor: '#faf5ff', color: '#9333ea', border: '1px solid #e9d5ff' }}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Kanban
            </div>

            <h2
              className="text-4xl lg:text-5xl font-bold tracking-tight mb-5 leading-tight"
              style={{ color: '#111827' }}
            >
              Plan and track work{' '}
              <span style={{ color: '#9333ea' }}>visually</span>.
            </h2>

            <p className="text-lg mb-8" style={{ color: '#6b7280' }}>
              Manage projects with simple drag-and-drop Kanban boards. See the big picture at a glance.
            </p>

            <div className="space-y-4">
              {[
                { label: 'Drag & drop cards', desc: 'Move tasks between columns effortlessly' },
                { label: 'Custom labels', desc: 'Organize with color-coded tags' },
                { label: 'Due dates', desc: 'Never miss a deadline' },
                { label: 'Team collaboration', desc: 'Work together in real-time' },
              ].map((feature, i) => (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, x: -16 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.3 + i * 0.08, duration: 0.5 }}
                  className="flex items-center gap-3"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: '#faf5ff' }}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#9333ea', opacity: 0.6 }} />
                  </div>
                  <div>
                    <span className="text-sm font-medium" style={{ color: '#111827' }}>{feature.label}</span>
                    <span className="text-sm" style={{ color: '#6b7280' }}> — {feature.desc}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Kanban mockup */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative order-1 lg:order-2"
          >
            <div
              className="rounded-2xl p-5 overflow-hidden"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
              }}
            >
              {/* Board header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold" style={{ color: '#111827' }}>Product Roadmap</h3>
                <button
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
                  style={{ backgroundColor: '#f3f4f6', color: '#6b7280' }}
                >
                  <Plus className="w-3 h-3" />
                  Add
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {columns.map((column, colIndex) => (
                  <motion.div
                    key={column.name}
                    initial={{ opacity: 0, y: 16 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.3 + colIndex * 0.1, duration: 0.5 }}
                    className="rounded-xl p-3"
                    style={{ backgroundColor: column.bg, border: `1px solid ${column.border}` }}
                  >
                    <div className="flex items-center gap-1.5 mb-3">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: column.dotColor }} />
                      <span className="text-xs font-medium" style={{ color: '#374151' }}>{column.name}</span>
                      <span className="text-xs ml-auto" style={{ color: '#9ca3af' }}>{column.cards.length}</span>
                    </div>

                    <div className="space-y-2">
                      {column.cards.map((card, cardIndex) => (
                        <motion.div
                          key={card.title}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={isInView ? { opacity: 1, scale: 1 } : {}}
                          transition={{ delay: 0.5 + colIndex * 0.1 + cardIndex * 0.08, duration: 0.4 }}
                          whileHover={{ y: -1 }}
                          className="rounded-lg p-2.5 cursor-pointer transition-shadow hover:shadow-sm"
                          style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <p className="text-xs font-medium leading-snug" style={{ color: '#111827' }}>{card.title}</p>
                            <MoreHorizontal className="w-3 h-3 flex-shrink-0 ml-1" style={{ color: '#9ca3af' }} />
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                              style={{ backgroundColor: card.tagBg, color: card.tagColor }}
                            >
                              {card.tag}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-2 text-[10px]" style={{ color: '#9ca3af' }}>
                            <Calendar className="w-3 h-3" />
                            {card.date}
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <button
                      className="w-full mt-2 py-1.5 flex items-center justify-center gap-1 text-xs rounded-lg transition-colors"
                      style={{ color: '#9ca3af' }}
                    >
                      <Plus className="w-3 h-3" />
                      Add
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Floating drag badge */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -bottom-4 -right-4 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                color: '#374151',
              }}
            >
              <Tag className="w-3.5 h-3.5" style={{ color: '#9333ea' }} />
              Drag to reorder
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FeatureKanban;
