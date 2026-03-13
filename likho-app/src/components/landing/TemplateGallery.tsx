import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import {
  Rocket, Calendar, Layout, Target, Lightbulb,
  Users, BarChart3, ArrowRight,
} from 'lucide-react';

const templates = [
  { name: 'Product Roadmap', icon: Rocket, bg: '#fff7ed', color: '#ea580c', category: 'Product' },
  { name: 'Meeting Notes', icon: Calendar, bg: '#eff6ff', color: '#2563eb', category: 'Work' },
  { name: 'Startup Dashboard', icon: Layout, bg: '#faf5ff', color: '#9333ea', category: 'Startup' },
  { name: 'Weekly Planner', icon: Target, bg: '#f0fdf4', color: '#16a34a', category: 'Personal' },
  { name: 'Content Calendar', icon: Calendar, bg: '#fdf2f8', color: '#db2777', category: 'Marketing' },
  { name: 'Idea Board', icon: Lightbulb, bg: '#fefce8', color: '#ca8a04', category: 'Creative' },
  { name: 'Team Wiki', icon: Users, bg: '#ecfeff', color: '#0891b2', category: 'Team' },
  { name: 'Analytics Dashboard', icon: BarChart3, bg: '#f0f9ff', color: '#0284c7', category: 'Data' },
];

const TemplateGallery = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section
      ref={ref}
      id="templates"
      className="py-24 lg:py-32"
      style={{ backgroundColor: '#ffffff', borderTop: '1px solid #f3f4f6' }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-5"
            style={{ backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb' }}
          >
            Templates
          </div>
          <h2
            className="text-4xl lg:text-5xl font-bold tracking-tight mb-4"
            style={{ color: '#111827' }}
          >
            Start with a <span style={{ color: '#6366f1' }}>template</span>.
          </h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: '#6b7280' }}>
            Choose from dozens of pre-built templates designed for every type of work.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {templates.map((template, i) => {
            const Icon = template.icon;
            return (
              <motion.div
                key={template.name}
                initial={{ opacity: 0, y: 16 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.08 * i, duration: 0.5 }}
                whileHover={{ y: -3 }}
                className="group relative rounded-xl p-4 cursor-pointer transition-all"
                style={{ backgroundColor: '#fafafa', border: '1px solid #e5e7eb' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = template.color + '66';
                  e.currentTarget.style.boxShadow = `0 4px 16px ${template.color}18`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: template.bg }}
                >
                  <Icon className="w-5 h-5" style={{ color: template.color }} />
                </div>
                <div className="text-[10px] font-medium mb-0.5" style={{ color: '#9ca3af' }}>{template.category}</div>
                <h3 className="text-sm font-semibold" style={{ color: '#111827' }}>{template.name}</h3>

                <div
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ArrowRight className="w-3.5 h-3.5" style={{ color: template.color }} />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* View all */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-center mt-10"
        >
          <button
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            style={{
              backgroundColor: '#ffffff',
              color: '#374151',
              border: '1px solid #d1d5db',
              boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f9fafb')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
          >
            View all 50+ templates
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default TemplateGallery;
