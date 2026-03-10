import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { FileX, Frown } from 'lucide-react';

const Problem = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 lg:py-32 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Illustration */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="relative order-2 lg:order-1"
          >
            <div className="relative bg-surface/50 border border-border/50 rounded-2xl p-8">
              {/* Empty Page Illustration */}
              <div className="bg-background rounded-xl border border-border/50 p-6 min-h-[300px] flex flex-col items-center justify-center">
                <div className="w-full max-w-sm">
                  {/* Toolbar placeholder */}
                  <div className="flex gap-2 mb-6">
                    <div className="h-8 w-8 rounded bg-muted" />
                    <div className="h-8 w-8 rounded bg-muted" />
                    <div className="h-8 w-8 rounded bg-muted" />
                    <div className="flex-1" />
                    <div className="h-8 w-20 rounded bg-muted" />
                  </div>

                  {/* Empty content area */}
                  <div className="flex flex-col items-center justify-center py-12">
                    <motion.div
                      animate={{ rotate: [0, -10, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4"
                    >
                      <Frown className="w-10 h-10 text-muted-foreground/50" />
                    </motion.div>
                    <div className="h-4 bg-muted rounded w-48 mb-3" />
                    <div className="h-3 bg-muted/60 rounded w-32" />
                  </div>

                  {/* Blinking cursor */}
                  <motion.div
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="h-6 w-0.5 bg-foreground/30 mx-auto mt-8"
                  />
                </div>
              </div>

              {/* Floating "confused" indicator */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="absolute -top-3 -right-3 bg-surface border border-border/50 rounded-xl p-3 shadow-lg"
              >
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileX className="w-4 h-4" />
                  <span className="text-xs font-medium">Where do I start?</span>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="order-1 lg:order-2"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-6">
              Most productivity tools start with an{' '}
              <span className="text-muted-foreground">empty page</span>.
            </h2>

            <p className="text-lg text-muted-foreground mb-6">
              You open a new workspace and spend more time setting things up than actually doing work.
            </p>

            <ul className="space-y-4">
              {[
                'Create folders, pages, and structures from scratch',
                'Search for templates across different websites',
                'Copy-paste content and reformat everything',
                'Lose momentum before you even begin',
              ].map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.4 + i * 0.1, duration: 0.5 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 flex-shrink-0" />
                  <span className="text-muted-foreground">{item}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Problem;
