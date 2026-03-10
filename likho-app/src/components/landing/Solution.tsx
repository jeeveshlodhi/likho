import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { 
  Rocket, 
  Calendar, 
  BookOpen, 
  Layout, 
  Brain,
  Sparkles,
  ArrowRight
} from 'lucide-react';

const templates = [
  { name: 'Startup Planner', icon: Rocket, color: 'from-orange-400 to-red-400', description: 'Plan your MVP' },
  { name: 'Meeting Notes', icon: Calendar, color: 'from-blue-400 to-cyan-400', description: 'Track decisions' },
  { name: 'Daily Journal', icon: BookOpen, color: 'from-green-400 to-emerald-400', description: 'Reflect daily' },
  { name: 'Project Board', icon: Layout, color: 'from-purple-400 to-pink-400', description: 'Manage tasks' },
  { name: 'Second Brain', icon: Brain, color: 'from-indigo-400 to-violet-400', description: 'Build knowledge' },
];

const Solution = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 lg:py-32 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/5 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium mb-6"
            >
              <Sparkles className="w-4 h-4" />
              <span>Likho starts differently</span>
            </motion.div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-6">
              Start with{' '}
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                ready workflows
              </span>.
            </h2>

            <p className="text-lg text-muted-foreground mb-8">
              Instead of building systems from scratch, choose a template and start working immediately.
            </p>

            <div className="flex items-center gap-4">
              <button
                onClick={() => document.querySelector('#templates')?.scrollIntoView({ behavior: 'smooth' })}
                className="group inline-flex items-center gap-2 text-foreground font-medium hover:gap-3 transition-all"
              >
                Browse all templates
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>

          {/* Template Grid */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative"
          >
            <div className="bg-surface/50 border border-border/50 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">Choose a template</h3>
                <span className="text-xs text-muted-foreground">50+ available</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {templates.map((template, i) => (
                  <motion.div
                    key={template.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="group relative bg-background border border-border/50 rounded-xl p-4 cursor-pointer hover:border-indigo-500/30 hover:shadow-lg transition-all"
                  >
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${template.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      <template.icon className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="text-sm font-medium text-foreground mb-1">{template.name}</h4>
                    <p className="text-xs text-muted-foreground">{template.description}</p>
                  </motion.div>
                ))}
              </div>

              {/* Selection indicator */}
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute top-24 right-8 w-3 h-3 rounded-full bg-green-400 shadow-lg shadow-green-400/50"
              />
            </div>

            {/* Floating badge */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-4 -left-4 bg-surface border border-border/50 rounded-xl p-3 shadow-lg"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-xs text-muted-foreground">Ready in 2 seconds</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Solution;
