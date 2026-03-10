import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { GraduationCap, Rocket, Palette, CheckCircle2 } from 'lucide-react';

const useCases = [
  {
    title: 'For students',
    icon: GraduationCap,
    color: 'from-blue-400 to-cyan-400',
    description: 'Organize coursework, take lecture notes, and plan projects.',
    features: [
      'Course note templates',
      'Assignment tracking',
      'Study schedule planner',
      'Research organization',
    ],
  },
  {
    title: 'For founders',
    icon: Rocket,
    color: 'from-purple-400 to-pink-400',
    description: 'Build your startup with structured planning and execution.',
    features: [
      'Startup dashboard',
      'Investor pitch deck',
      'Product roadmap',
      'Team wiki & docs',
    ],
  },
  {
    title: 'For creators',
    icon: Palette,
    color: 'from-orange-400 to-red-400',
    description: 'Capture ideas and publish content consistently.',
    features: [
      'Content calendar',
      'Idea boards',
      'Editorial workflow',
      'Asset library',
    ],
  },
];

const UseCases = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 lg:py-32 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-6">
            Built for how{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              people work
            </span>.
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Whatever you do, there is a template for you.
          </p>
        </motion.div>

        {/* Use Cases Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {useCases.map((useCase, i) => (
            <motion.div
              key={useCase.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 + i * 0.1, duration: 0.5 }}
              whileHover={{ y: -4 }}
              className="group relative bg-surface/50 border border-border/50 rounded-2xl p-6 hover:border-indigo-500/30 hover:shadow-xl transition-all"
            >
              {/* Icon */}
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${useCase.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <useCase.icon className="w-7 h-7 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-foreground mb-3">{useCase.title}</h3>
              <p className="text-muted-foreground mb-6">{useCase.description}</p>

              {/* Features */}
              <ul className="space-y-3">
                {useCase.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Hover gradient */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${useCase.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCases;
