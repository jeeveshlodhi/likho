import { motion } from 'framer-motion';
import { Link } from 'react-router';
import { ArrowRight, Sparkles, FileText, LayoutGrid, Palette, ChevronRight } from 'lucide-react';

const Hero = () => {
  return (
    <section className="relative min-h-[calc(100vh-64px)] flex items-center pt-16">
      {/* Background Gradient */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-indigo-500/10 via-transparent to-transparent rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-6"
            >
              <Sparkles className="w-4 h-4" />
              <span>Now with AI-powered templates</span>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
              A workspace that{' '}
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                starts ready
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
              Notes, Kanban boards, and visual canvases — already structured with templates so you can start working instantly.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Link
                to="/auth/sign-up"
                className="group inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background text-base font-medium rounded-xl hover:opacity-90 transition-all hover:gap-3"
              >
                Start writing
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <button
                onClick={() => document.querySelector('#templates')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Explore templates
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Social Proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mt-12 flex items-center gap-4 justify-center lg:justify-start"
            >
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 border-2 border-background flex items-center justify-center text-white text-xs font-medium"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="text-foreground font-medium">2,000+</span> thinkers already using Likho
              </p>
            </motion.div>
          </motion.div>

          {/* Right Content - Product Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="relative"
          >
            <div className="relative bg-surface/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4 shadow-2xl">
              {/* Main Product Mockup */}
              <div className="bg-background rounded-xl overflow-hidden border border-border/50">
                {/* Mockup Header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-surface/50">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                    <div className="w-3 h-3 rounded-full bg-green-400/80" />
                  </div>
                  <div className="flex-1 text-center">
                    <span className="text-xs text-muted-foreground">Product Roadmap 2025</span>
                  </div>
                </div>

                {/* Mockup Content */}
                <div className="p-4 grid grid-cols-3 gap-3">
                  {/* Notes Column */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                      <FileText className="w-3.5 h-3.5" />
                      Notes
                    </div>
                    <div className="bg-surface rounded-lg p-3 border border-border/50">
                      <div className="h-2 bg-foreground/10 rounded w-3/4 mb-2" />
                      <div className="h-2 bg-foreground/10 rounded w-full mb-1.5" />
                      <div className="h-2 bg-foreground/10 rounded w-5/6" />
                    </div>
                    <div className="bg-surface rounded-lg p-3 border border-border/50">
                      <div className="h-2 bg-foreground/10 rounded w-full mb-1.5" />
                      <div className="h-2 bg-foreground/10 rounded w-4/5" />
                    </div>
                  </div>

                  {/* Kanban Column */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                      <LayoutGrid className="w-3.5 h-3.5" />
                      Board
                    </div>
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-2">
                      <div className="h-1.5 bg-indigo-400/30 rounded w-3/4 mb-1.5" />
                      <div className="h-1 bg-indigo-400/20 rounded w-1/2" />
                    </div>
                    <div className="bg-surface rounded-lg p-2 border border-border/50">
                      <div className="h-1.5 bg-foreground/10 rounded w-full mb-1" />
                      <div className="h-1 bg-foreground/10 rounded w-2/3" />
                    </div>
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2">
                      <div className="h-1.5 bg-green-400/30 rounded w-4/5" />
                    </div>
                  </div>

                  {/* Canvas Column */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                      <Palette className="w-3.5 h-3.5" />
                      Canvas
                    </div>
                    <div className="bg-surface rounded-lg p-3 border border-border/50 h-24 relative overflow-hidden">
                      <div className="absolute top-3 left-3 w-6 h-6 rounded bg-purple-500/20 border border-purple-500/30" />
                      <div className="absolute top-8 right-4 w-6 h-6 rounded bg-indigo-500/20 border border-indigo-500/30" />
                      <div className="absolute bottom-4 left-8 w-6 h-6 rounded bg-pink-500/20 border border-pink-500/30" />
                      <svg className="absolute inset-0 w-full h-full opacity-30">
                        <line x1="20" y1="20" x2="70" y2="40" stroke="currentColor" strokeWidth="1" className="text-purple-400" />
                        <line x1="70" y1="40" x2="40" y2="80" stroke="currentColor" strokeWidth="1" className="text-indigo-400" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-4 -right-4 bg-surface border border-border/50 rounded-xl p-3 shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">AI Ready</p>
                    <p className="text-[10px] text-muted-foreground">Template applied</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute -bottom-4 -left-4 bg-surface border border-border/50 rounded-xl p-3 shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1.5">
                    <div className="w-6 h-6 rounded-full bg-indigo-500 border-2 border-surface" />
                    <div className="w-6 h-6 rounded-full bg-purple-500 border-2 border-surface" />
                  </div>
                  <p className="text-xs text-muted-foreground">2 editing</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
