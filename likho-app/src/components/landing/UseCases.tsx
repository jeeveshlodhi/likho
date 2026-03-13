import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { GraduationCap, Rocket, Palette, CheckCircle2 } from 'lucide-react';

const useCases = [
  {
    title: 'For students',
    icon: GraduationCap,
    bg: '#eff6ff',
    color: '#2563eb',
    accent: '#dbeafe',
    description: 'Organize coursework, take lecture notes, and plan projects.',
    features: ['Course note templates', 'Assignment tracking', 'Study schedule planner', 'Research organization'],
  },
  {
    title: 'For founders',
    icon: Rocket,
    bg: '#faf5ff',
    color: '#9333ea',
    accent: '#e9d5ff',
    description: 'Build your startup with structured planning and execution.',
    features: ['Startup dashboard', 'Investor pitch deck', 'Product roadmap', 'Team wiki & docs'],
  },
  {
    title: 'For creators',
    icon: Palette,
    bg: '#fff7ed',
    color: '#ea580c',
    accent: '#fed7aa',
    description: 'Capture ideas and publish content consistently.',
    features: ['Content calendar', 'Idea boards', 'Editorial workflow', 'Asset library'],
  },
];

const UseCases = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section
      ref={ref}
      className="py-24 lg:py-32"
      style={{ backgroundColor: '#fafafa', borderTop: '1px solid #f3f4f6' }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2
            className="text-4xl lg:text-5xl font-bold tracking-tight mb-4"
            style={{ color: '#111827' }}
          >
            Built for how{' '}
            <span style={{ color: '#9ca3af' }}>people work</span>.
          </h2>
          <p className="text-lg" style={{ color: '#6b7280' }}>
            Whatever you do, there is a template for you.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-5">
          {useCases.map((useCase, i) => {
            const Icon = useCase.icon;
            return (
              <motion.div
                key={useCase.title}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.1 + i * 0.1, duration: 0.5 }}
                whileHover={{ y: -4 }}
                className="group rounded-2xl p-6 transition-all"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = useCase.accent;
                  e.currentTarget.style.boxShadow = `0 4px 20px rgba(0,0,0,0.07)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)';
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: useCase.bg }}
                >
                  <Icon className="w-6 h-6" style={{ color: useCase.color }} />
                </div>

                <h3 className="text-lg font-bold mb-2" style={{ color: '#111827' }}>{useCase.title}</h3>
                <p className="text-sm mb-5" style={{ color: '#6b7280' }}>{useCase.description}</p>

                <ul className="space-y-2.5">
                  {useCase.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5 text-sm">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#22c55e' }} />
                      <span style={{ color: '#374151' }}>{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default UseCases;
