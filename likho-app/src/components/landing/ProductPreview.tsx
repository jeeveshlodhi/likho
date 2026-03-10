import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Sparkles, FileText, LayoutGrid, Palette, Zap } from 'lucide-react';

const ProductPreview = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 lg:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 via-transparent to-purple-500/5" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-6">
            A workspace for{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              thinking
            </span>.
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to capture ideas, plan projects, and bring your vision to life.
          </p>
        </motion.div>

        {/* Main Preview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          <div className="relative bg-surface/50 border border-border/50 rounded-2xl p-4 lg:p-6 backdrop-blur-sm shadow-2xl">
            {/* App Header */}
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">L</span>
                  </div>
                  <span className="font-semibold text-foreground">Likho</span>
                </div>
                <div className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground">
                  <span>Workspace</span>
                  <span>/</span>
                  <span className="text-foreground">Product Launch</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                  <Zap className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-xs font-medium text-indigo-400">AI Active</span>
                </div>
                <div className="flex -space-x-2">
                  <div className="w-7 h-7 rounded-full bg-indigo-500 border-2 border-surface flex items-center justify-center text-white text-xs">A</div>
                  <div className="w-7 h-7 rounded-full bg-purple-500 border-2 border-surface flex items-center justify-center text-white text-xs">B</div>
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
                className="bg-background rounded-xl border border-border/50 overflow-hidden"
              >
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-surface/30">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-foreground">Launch Notes</span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="h-2 bg-foreground/20 rounded w-3/4" />
                  <div className="h-2 bg-foreground/10 rounded w-full" />
                  <div className="h-2 bg-foreground/10 rounded w-5/6" />
                  <div className="h-2 bg-foreground/10 rounded w-full" />
                  <div className="pt-2">
                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded border-2 border-green-500/50 mt-0.5 flex items-center justify-center">
                        <motion.div
                          animate={{ scale: [0, 1] }}
                          transition={{ delay: 1.5, duration: 0.3 }}
                          className="w-2.5 h-2.5 rounded-sm bg-green-500/50"
                        />
                      </div>
                      <div className="flex-1 h-2 bg-green-500/20 rounded" />
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded border-2 border-border mt-0.5" />
                    <div className="flex-1 h-2 bg-foreground/10 rounded" />
                  </div>
                </div>
              </motion.div>

              {/* Kanban Panel */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="bg-background rounded-xl border border-border/50 overflow-hidden"
              >
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-surface/30">
                  <LayoutGrid className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium text-foreground">Tasks</span>
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 text-xs font-medium text-muted-foreground">Todo</div>
                    <div className="flex-1 text-xs font-medium text-muted-foreground">Done</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <motion.div
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-2"
                    >
                      <div className="h-1.5 bg-indigo-400/30 rounded w-full mb-1" />
                      <div className="h-1 bg-indigo-400/20 rounded w-2/3" />
                    </motion.div>
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2">
                      <div className="h-1.5 bg-green-400/30 rounded w-full mb-1" />
                      <div className="h-1 bg-green-400/20 rounded w-3/4" />
                    </div>
                    <div className="bg-surface border border-border/50 rounded-lg p-2">
                      <div className="h-1.5 bg-foreground/10 rounded w-5/6 mb-1" />
                      <div className="h-1 bg-foreground/10 rounded w-1/2" />
                    </div>
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2">
                      <div className="h-1.5 bg-green-400/30 rounded w-full" />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Canvas Panel */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="bg-background rounded-xl border border-border/50 overflow-hidden"
              >
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-surface/30">
                  <Palette className="w-4 h-4 text-pink-400" />
                  <span className="text-sm font-medium text-foreground">Vision Board</span>
                </div>
                <div className="p-3 h-48 relative">
                  <svg className="absolute inset-0 w-full h-full">
                    <motion.line
                      x1="20%" y1="30%" x2="60%" y2="20%"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="text-indigo-400/40"
                      initial={{ pathLength: 0 }}
                      animate={isInView ? { pathLength: 1 } : {}}
                      transition={{ delay: 1, duration: 0.8 }}
                    />
                    <motion.line
                      x1="60%" y1="20%" x2="40%" y2="70%"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="text-purple-400/40"
                      initial={{ pathLength: 0 }}
                      animate={isInView ? { pathLength: 1 } : {}}
                      transition={{ delay: 1.2, duration: 0.8 }}
                    />
                  </svg>
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-4 left-4 w-16 h-12 rounded-lg bg-indigo-500/20 border border-indigo-500/30"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    className="absolute top-3 right-8 w-14 h-10 rounded-lg bg-purple-500/20 border border-purple-500/30"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-8 left-8 w-20 h-14 rounded-lg bg-pink-500/20 border border-pink-500/30"
                  />
                </div>
              </motion.div>
            </div>

            {/* Floating Badge */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-4 right-8 bg-surface border border-border/50 rounded-xl p-3 shadow-lg"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium text-foreground">Templates ready</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ProductPreview;
