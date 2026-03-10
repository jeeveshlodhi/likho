import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { LayoutGrid, Calendar, Tag, MoreHorizontal, Plus } from 'lucide-react';

const columns = [
  { 
    name: 'Todo', 
    color: 'bg-slate-500/20 border-slate-500/30',
    cards: [
      { title: 'Research competitors', tags: ['Research'], date: 'Today' },
      { title: 'Draft landing page', tags: ['Design'], date: 'Tomorrow' },
    ]
  },
  { 
    name: 'In Progress', 
    color: 'bg-indigo-500/20 border-indigo-500/30',
    cards: [
      { title: 'Design system v2', tags: ['Design', 'Dev'], date: 'In 2 days' },
    ]
  },
  { 
    name: 'Done', 
    color: 'bg-green-500/20 border-green-500/30',
    cards: [
      { title: 'User interviews', tags: ['Research'], date: 'Yesterday' },
    ]
  },
];

const FeatureKanban = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 lg:py-32 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="order-2 lg:order-1"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-6">
              <LayoutGrid className="w-4 h-4" />
              <span>Kanban</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-6">
              Plan and track work{' '}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                visually
              </span>.
            </h2>

            <p className="text-lg text-muted-foreground mb-8">
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
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                  className="flex items-center gap-4"
                >
                  <div className="w-8 h-8 rounded-lg bg-surface border border-border/50 flex items-center justify-center flex-shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-400/50" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-foreground">{feature.label}</h4>
                    <p className="text-xs text-muted-foreground">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Illustration */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative order-1 lg:order-2"
          >
            <div className="relative bg-surface/50 border border-border/50 rounded-2xl p-6 backdrop-blur-sm">
              {/* Kanban Board Mockup */}
              <div className="bg-background rounded-xl border border-border/50 overflow-hidden p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-foreground">Product Roadmap</h3>
                  <button className="p-1.5 rounded-lg hover:bg-accent transition-colors">
                    <Plus className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {columns.map((column, colIndex) => (
                    <motion.div
                      key={column.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={isInView ? { opacity: 1, y: 0 } : {}}
                      transition={{ delay: 0.4 + colIndex * 0.15, duration: 0.5 }}
                      className={`rounded-lg p-3 ${column.color}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-foreground">{column.name}</span>
                        <span className="text-xs text-muted-foreground">{column.cards.length}</span>
                      </div>

                      <div className="space-y-2">
                        {column.cards.map((card, cardIndex) => (
                          <motion.div
                            key={card.title}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={isInView ? { opacity: 1, scale: 1 } : {}}
                            transition={{ 
                              delay: 0.6 + colIndex * 0.1 + cardIndex * 0.1, 
                              duration: 0.4 
                            }}
                            whileHover={{ scale: 1.02, y: -2 }}
                            className="bg-background rounded-lg p-3 border border-border/50 shadow-sm cursor-pointer hover:shadow-md transition-all"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <p className="text-xs font-medium text-foreground">{card.title}</p>
                              <MoreHorizontal className="w-3 h-3 text-muted-foreground" />
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {card.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="px-1.5 py-0.5 rounded text-[10px] bg-surface border border-border/50 text-muted-foreground"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              <span>{card.date}</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      <button className="w-full mt-2 py-1.5 flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:bg-background/50 rounded transition-colors">
                        <Plus className="w-3 h-3" />
                        Add card
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Floating indicator */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-3 -right-3 bg-surface border border-border/50 rounded-xl p-3 shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ x: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="w-8 h-10 rounded bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center"
                  >
                    <Tag className="w-4 h-4 text-indigo-400" />
                  </motion.div>
                  <div className="text-xs text-muted-foreground">Drag me</div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FeatureKanban;
