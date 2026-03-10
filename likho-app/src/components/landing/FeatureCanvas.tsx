import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Palette, MousePointer2, Hand, ZoomIn, Circle, Square, Type } from 'lucide-react';

const canvasElements = [
  { type: 'node', x: 15, y: 20, w: 24, h: 16, color: 'from-indigo-400 to-purple-400', delay: 0 },
  { type: 'node', x: 55, y: 15, w: 24, h: 16, color: 'from-purple-400 to-pink-400', delay: 0.1 },
  { type: 'node', x: 35, y: 55, w: 28, h: 20, color: 'from-pink-400 to-rose-400', delay: 0.2 },
  { type: 'node', x: 70, y: 50, w: 20, h: 14, color: 'from-blue-400 to-indigo-400', delay: 0.3 },
];

const connections = [
  { from: { x: 27, y: 28 }, to: { x: 55, y: 23 }, delay: 0.4 },
  { from: { x: 55, y: 31 }, to: { x: 49, y: 55 }, delay: 0.5 },
  { from: { x: 49, y: 75 }, to: { x: 70, y: 57 }, delay: 0.6 },
];

const FeatureCanvas = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 lg:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Illustration */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            <div className="relative bg-surface/50 border border-border/50 rounded-2xl p-6 backdrop-blur-sm">
              {/* Canvas Mockup */}
              <div className="bg-background rounded-xl border border-border/50 overflow-hidden">
                {/* Canvas Toolbar */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-surface/30">
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 rounded hover:bg-accent transition-colors text-foreground">
                      <MousePointer2 className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground">
                      <Hand className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-border mx-1" />
                    <button className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground">
                      <Type className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground">
                      <Square className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground">
                      <Circle className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <ZoomIn className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">100%</span>
                  </div>
                </div>

                {/* Canvas Area */}
                <div className="relative h-80 bg-surface/20 overflow-hidden">
                  {/* Grid pattern */}
                  <div 
                    className="absolute inset-0 opacity-30"
                    style={{
                      backgroundImage: `
                        linear-gradient(to right, var(--border) 1px, transparent 1px),
                        linear-gradient(to bottom, var(--border) 1px, transparent 1px)
                      `,
                      backgroundSize: '20px 20px'
                    }}
                  />

                  {/* SVG Connections */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {connections.map((conn, i) => (
                      <motion.line
                        key={i}
                        x1={`${conn.from.x}%`}
                        y1={`${conn.from.y}%`}
                        x2={`${conn.to.x}%`}
                        y2={`${conn.to.y}%`}
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                        className="text-indigo-400/50"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={isInView ? { pathLength: 1, opacity: 1 } : {}}
                        transition={{ 
                          delay: conn.delay, 
                          duration: 0.8,
                          ease: "easeInOut"
                        }}
                      />
                    ))}
                  </svg>

                  {/* Nodes */}
                  {canvasElements.map((el, i) => (
                    <motion.div
                      key={i}
                      className="absolute rounded-xl bg-gradient-to-br shadow-lg cursor-move"
                      style={{
                        left: `${el.x}%`,
                        top: `${el.y}%`,
                        width: `${el.w}%`,
                        height: `${el.h}%`,
                      }}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={isInView ? { opacity: 1, scale: 1 } : {}}
                      transition={{ 
                        delay: el.delay, 
                        duration: 0.5,
                        type: "spring",
                        stiffness: 200
                      }}
                      whileHover={{ scale: 1.05, zIndex: 10 }}
                    >
                      <div className={`w-full h-full rounded-xl bg-gradient-to-br ${el.color} opacity-20 border border-white/20`} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2/3 space-y-1.5">
                          <div className="h-2 bg-white/30 rounded" />
                          <div className="h-2 bg-white/20 rounded w-4/5" />
                          <div className="h-2 bg-white/20 rounded w-3/5" />
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* Cursor indicator */}
                  <motion.div
                    animate={{
                      x: [50, 150, 200, 100, 50],
                      y: [80, 60, 120, 150, 80],
                    }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute w-5 h-5 pointer-events-none"
                  >
                    <MousePointer2 className="w-5 h-5 text-indigo-400 fill-indigo-400/20" />
                  </motion.div>
                </div>
              </div>

              {/* Floating tools */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-3 -right-3 bg-surface border border-border/50 rounded-xl p-2 shadow-lg"
              >
                <div className="flex gap-1">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                    <Type className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Square className="w-4 h-4 text-purple-400" />
                  </div>
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
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-sm font-medium mb-6">
              <Palette className="w-4 h-4" />
              <span>Canvas</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-6">
              Think freely on a{' '}
              <span className="bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
                visual canvas
              </span>.
            </h2>

            <p className="text-lg text-muted-foreground mb-8">
              Sketch ideas, connect thoughts, and build mind maps on an infinite canvas.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Infinite canvas', desc: 'No boundaries to your thinking' },
                { label: 'Connect ideas', desc: 'Draw links between concepts' },
                { label: 'Shape library', desc: 'Quick visual elements' },
                { label: 'Export & share', desc: 'PNG, SVG, PDF formats' },
              ].map((feature, i) => (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-2 h-2 rounded-full bg-pink-400 mt-2 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-foreground">{feature.label}</h4>
                    <p className="text-xs text-muted-foreground">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FeatureCanvas;
