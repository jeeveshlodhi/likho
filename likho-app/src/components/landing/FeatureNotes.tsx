import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { FileText, Heading1, List, CheckSquare, Image, Code, Quote } from 'lucide-react';

const blockTypes = [
  { icon: Heading1, label: 'Heading', color: 'bg-blue-500/20 text-blue-400' },
  { icon: List, label: 'List', color: 'bg-purple-500/20 text-purple-400' },
  { icon: CheckSquare, label: 'Todo', color: 'bg-green-500/20 text-green-400' },
  { icon: Image, label: 'Image', color: 'bg-pink-500/20 text-pink-400' },
  { icon: Code, label: 'Code', color: 'bg-orange-500/20 text-orange-400' },
  { icon: Quote, label: 'Quote', color: 'bg-yellow-500/20 text-yellow-400' },
];

const FeatureNotes = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} id="features" className="py-24 lg:py-32 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Illustration */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            <div className="relative bg-surface/50 border border-border/50 rounded-2xl p-6 backdrop-blur-sm">
              {/* Editor Mockup */}
              <div className="bg-background rounded-xl border border-border/50 overflow-hidden">
                {/* Editor Toolbar */}
                <div className="flex items-center gap-1 px-4 py-2 border-b border-border/50 bg-surface/30">
                  {blockTypes.slice(0, 4).map((block) => (
                    <div
                      key={block.label}
                      className={`p-1.5 rounded ${block.color} cursor-pointer hover:opacity-80 transition-opacity`}
                    >
                      <block.icon className="w-4 h-4" />
                    </div>
                  ))}
                  <div className="flex-1" />
                  <div className="text-xs text-muted-foreground">Saved just now</div>
                </div>

                {/* Editor Content */}
                <div className="p-6 space-y-4">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : {}}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="space-y-2"
                  >
                    <div className="h-8 bg-foreground/10 rounded w-3/4" />
                    <div className="h-4 bg-foreground/10 rounded w-full" />
                    <div className="h-4 bg-foreground/10 rounded w-5/6" />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-5 h-5 rounded border-2 border-green-500/50 flex items-center justify-center mt-0.5">
                      <motion.div
                        animate={{ scale: [0, 1] }}
                        transition={{ delay: 1, duration: 0.3 }}
                        className="w-3 h-3 rounded-sm bg-green-500/50"
                      />
                    </div>
                    <div className="flex-1 h-4 bg-green-500/20 rounded" />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-5 h-5 rounded border-2 border-border flex items-center justify-center mt-0.5" />
                    <div className="flex-1 h-4 bg-foreground/10 rounded" />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : {}}
                    transition={{ delay: 0.7, duration: 0.5 }}
                    className="pl-4 border-l-2 border-yellow-500/30 py-2"
                  >
                    <div className="h-3 bg-yellow-500/20 rounded w-full mb-2" />
                    <div className="h-3 bg-yellow-500/20 rounded w-4/5" />
                  </motion.div>

                  {/* Slash command menu */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.9, duration: 0.5 }}
                    className="mt-4 bg-surface border border-border/50 rounded-lg p-2 shadow-lg max-w-xs"
                  >
                    <div className="text-xs text-muted-foreground px-2 py-1.5">Blocks</div>
                    {blockTypes.slice(0, 4).map((block, i) => (
                      <div
                        key={block.label}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm ${
                          i === 0 ? 'bg-indigo-500/10 text-indigo-400' : 'text-foreground hover:bg-accent'
                        }`}
                      >
                        <block.icon className="w-4 h-4" />
                        <span>{block.label}</span>
                      </div>
                    ))}
                  </motion.div>
                </div>
              </div>

              {/* Floating block palette */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-3 -right-3 bg-surface border border-border/50 rounded-xl p-2 shadow-lg"
              >
                <div className="flex gap-1">
                  {blockTypes.map((block) => (
                    <div
                      key={block.label}
                      className={`p-2 rounded-lg ${block.color}`}
                    >
                      <block.icon className="w-4 h-4" />
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
              <FileText className="w-4 h-4" />
              <span>Notes</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-6">
              Write notes without{' '}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                friction
              </span>.
            </h2>

            <p className="text-lg text-muted-foreground mb-8">
              A block-based editor designed for thinking. Organize ideas with simple blocks instead of complex formatting.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Slash commands', desc: 'Type / for quick actions' },
                { label: 'Markdown support', desc: 'Write in your style' },
                { label: 'Drag & drop', desc: 'Reorder with ease' },
                { label: 'AI assistance', desc: 'Smart suggestions' },
              ].map((feature, i) => (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                  className="p-4 rounded-xl bg-surface/50 border border-border/50"
                >
                  <h4 className="text-sm font-medium text-foreground mb-1">{feature.label}</h4>
                  <p className="text-xs text-muted-foreground">{feature.desc}</p>
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
