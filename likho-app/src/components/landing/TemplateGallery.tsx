import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { 
  Rocket, 
  Calendar, 
  Layout, 
  Target, 
  Lightbulb,
  Users,
  BarChart3,
  ArrowRight
} from 'lucide-react';

const templates = [
  { 
    name: 'Product Roadmap', 
    icon: Rocket, 
    color: 'from-orange-400 to-red-400',
    category: 'Product',
    description: 'Plan features and releases'
  },
  { 
    name: 'Meeting Notes', 
    icon: Calendar, 
    color: 'from-blue-400 to-cyan-400',
    category: 'Work',
    description: 'Track decisions and action items'
  },
  { 
    name: 'Startup Dashboard', 
    icon: Layout, 
    color: 'from-purple-400 to-pink-400',
    category: 'Startup',
    description: 'Monitor key metrics'
  },
  { 
    name: 'Weekly Planner', 
    icon: Target, 
    color: 'from-green-400 to-emerald-400',
    category: 'Personal',
    description: 'Organize your week'
  },
  { 
    name: 'Content Calendar', 
    icon: Calendar, 
    color: 'from-pink-400 to-rose-400',
    category: 'Marketing',
    description: 'Plan and schedule content'
  },
  { 
    name: 'Idea Board', 
    icon: Lightbulb, 
    color: 'from-yellow-400 to-orange-400',
    category: 'Creative',
    description: 'Capture and develop ideas'
  },
  { 
    name: 'Team Wiki', 
    icon: Users, 
    color: 'from-indigo-400 to-violet-400',
    category: 'Team',
    description: 'Share knowledge'
  },
  { 
    name: 'Analytics Dashboard', 
    icon: BarChart3, 
    color: 'from-cyan-400 to-blue-400',
    category: 'Data',
    description: 'Visualize your data'
  },
];

const TemplateGallery = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} id="templates" className="py-24 lg:py-32 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-6">
            Start with a{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              template
            </span>.
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose from dozens of pre-built templates designed for every type of work.
          </p>
        </motion.div>

        {/* Template Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {templates.map((template, i) => (
            <motion.div
              key={template.name}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 + i * 0.05, duration: 0.5 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="group relative bg-surface/50 border border-border/50 rounded-xl p-5 cursor-pointer hover:border-indigo-500/30 hover:shadow-xl transition-all"
            >
              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <template.icon className="w-6 h-6 text-white" />
              </div>

              {/* Content */}
              <div className="text-xs text-muted-foreground mb-1">{template.category}</div>
              <h3 className="text-base font-semibold text-foreground mb-1">{template.name}</h3>
              <p className="text-sm text-muted-foreground">{template.description}</p>

              {/* Hover arrow */}
              <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-4 h-4 text-indigo-400" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* View all link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-center mt-12"
        >
          <button className="inline-flex items-center gap-2 px-6 py-3 bg-surface border border-border/50 rounded-xl text-foreground font-medium hover:border-indigo-500/30 hover:bg-accent transition-all">
            View all 50+ templates
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default TemplateGallery;
