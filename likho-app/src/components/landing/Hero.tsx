import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router';
import {
  FileText, LayoutGrid, Palette, Sparkles,
  ChevronRight, Lock, Database, Zap, Download, ArrowRight,
} from 'lucide-react';
import { useDesktopDownload } from '@/hooks/useDesktopDownload';

const featureTabs = [
  {
    id: 'notes',
    icon: FileText,
    label: 'Notes',
    description: 'Rich block editor',
    color: '#6366f1',
    bg: '#eef2ff',
    comingSoon: false,
  },
  {
    id: 'kanban',
    icon: Lock,
    label: 'Kanban',
    description: 'Visual workflows',
    color: '#f59e0b',
    bg: '#fffbeb',
    comingSoon: false,
  },
  {
    id: 'canvas',
    icon: Database,
    label: 'Canvas',
    description: 'Freeform thinking',
    color: '#10b981',
    bg: '#ecfdf5',
    comingSoon: false,
  },
  {
    id: 'ai',
    icon: Zap,
    label: 'AI',
    description: 'Smart assistance',
    color: '#8b5cf6',
    bg: '#f5f3ff',
    comingSoon: true,
  },
];

const HeroMockup = ({ activeTab }: { activeTab: string }) => {
  if (activeTab === 'notes') {
    return (
      <div className="p-6 space-y-3">
        <div className="flex items-center gap-2 mb-5">
          {['B', 'I', 'U', '⌘'].map((t, i) => (
            <div key={i} className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-medium" style={{ backgroundColor: '#f4f4f5', color: '#71717a' }}>{t}</div>
          ))}
          <div className="w-px h-4 mx-1" style={{ backgroundColor: '#e4e4e7' }} />
          <div className="flex-1" />
          <div className="text-xs px-2 py-0.5 rounded-md font-medium" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>Saved</div>
        </div>
        <div className="h-7 rounded-lg w-3/5" style={{ background: 'linear-gradient(90deg, #09090b 0%, #27272a 100%)', opacity: 0.09 }} />
        <div className="space-y-2 pt-1">
          <div className="h-3.5 rounded-md w-full" style={{ backgroundColor: '#f4f4f5' }} />
          <div className="h-3.5 rounded-md w-[90%]" style={{ backgroundColor: '#f4f4f5' }} />
          <div className="h-3.5 rounded-md w-[75%]" style={{ backgroundColor: '#f4f4f5' }} />
        </div>
        <div className="flex items-center gap-2.5 mt-4 py-3 px-3.5 rounded-lg" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#22c55e' }}>
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div className="h-3 rounded flex-1" style={{ backgroundColor: '#dcfce7' }} />
        </div>
        <div className="flex items-center gap-2.5 py-3 px-3.5 rounded-lg" style={{ backgroundColor: '#fafafa', border: '1px solid #e4e4e7' }}>
          <div className="w-4 h-4 rounded border-2 flex-shrink-0" style={{ borderColor: '#d4d4d8' }} />
          <div className="h-3 rounded flex-1" style={{ backgroundColor: '#f4f4f5' }} />
        </div>
        <div className="mt-3 pl-4 py-3 rounded-r-lg" style={{ borderLeft: '3px solid #fbbf24', backgroundColor: '#fffbeb' }}>
          <div className="h-2.5 rounded w-full mb-2" style={{ backgroundColor: '#fef3c7' }} />
          <div className="h-2.5 rounded w-4/5" style={{ backgroundColor: '#fef3c7' }} />
        </div>
      </div>
    );
  }

  if (activeTab === 'kanban') {
    return (
      <div className="p-5 flex gap-3 overflow-hidden">
        {[
          { label: 'Backlog', count: 3, color: '#a1a1aa', items: ['Research phase', 'User interviews', 'Design tokens'] },
          { label: 'In Progress', count: 2, color: '#6366f1', items: ['Build MVP', 'Write docs'] },
          { label: 'Done', count: 4, color: '#22c55e', items: ['Setup repo', 'CI/CD pipeline'] },
        ].map((col) => (
          <div key={col.label} className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-3">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
              <span className="text-xs font-semibold" style={{ color: '#3f3f46' }}>{col.label}</span>
              <span className="ml-auto text-xs px-1.5 py-0.5 rounded-md font-medium" style={{ backgroundColor: '#f4f4f5', color: '#a1a1aa' }}>{col.count}</span>
            </div>
            <div className="space-y-2">
              {col.items.map((item) => (
                <div
                  key={item}
                  className="p-2.5 rounded-lg text-xs font-medium"
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e4e4e7',
                    color: '#3f3f46',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                  }}
                >
                  {item}
                </div>
              ))}
              <div
                className="p-2.5 rounded-lg text-xs border-dashed flex items-center gap-1.5"
                style={{ border: '1px dashed #d4d4d8', color: '#a1a1aa' }}
              >
                <span>+</span> Add card
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activeTab === 'canvas') {
    return (
      <div className="p-6 relative h-full min-h-[220px]" style={{ backgroundColor: '#fafafa' }}>
        {/* Grid dots */}
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, #d4d4d8 1px, transparent 1px)', backgroundSize: '18px 18px', opacity: 0.5 }} />
        <div
          className="absolute top-6 left-8 w-28 h-16 rounded-xl flex items-center justify-center text-xs font-semibold shadow-sm"
          style={{ backgroundColor: '#ede9fe', color: '#7c3aed', border: '1px solid #ddd6fe', boxShadow: '0 2px 8px rgba(124,58,237,0.12)' }}
        >
          Idea Alpha
        </div>
        <div
          className="absolute top-10 right-10 w-24 h-14 rounded-xl flex items-center justify-center text-xs font-semibold shadow-sm"
          style={{ backgroundColor: '#dbeafe', color: '#1d4ed8', border: '1px solid #bfdbfe', boxShadow: '0 2px 8px rgba(29,78,216,0.10)' }}
        >
          Idea Beta
        </div>
        <div
          className="absolute bottom-8 left-14 w-24 h-14 rounded-xl flex items-center justify-center text-xs font-semibold shadow-sm"
          style={{ backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', boxShadow: '0 2px 8px rgba(21,128,61,0.10)' }}
        >
          Idea Gamma
        </div>
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.5 }}>
          <defs>
            <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill="#a78bfa" />
            </marker>
          </defs>
          <path d="M 120 38 C 180 38 160 46 190 46" stroke="#a78bfa" strokeWidth="1.5" fill="none" strokeDasharray="5 3" markerEnd="url(#arrow)" />
          <path d="M 98 80 C 80 110 72 120 80 148" stroke="#60a5fa" strokeWidth="1.5" fill="none" strokeDasharray="5 3" />
        </svg>
      </div>
    );
  }

  // AI tab
  return (
    <div className="p-5 space-y-3">
      <div className="flex items-center gap-2.5 mb-4">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }}
        >
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="text-sm font-semibold" style={{ color: '#09090b' }}>AI Assistant</div>
          <div className="text-xs" style={{ color: '#a1a1aa' }}>Powered by local + cloud AI</div>
        </div>
      </div>
      {[
        { prompt: 'Summarize my meeting notes', reply: 'Key decisions: Launch Q2, hire 3 engineers, migrate to new stack by EOQ.' },
        { prompt: 'Suggest tags for this note', reply: '#product #roadmap #2025 #strategy' },
      ].map((item, i) => (
        <div key={i} className="space-y-2">
          <div className="flex justify-end">
            <div className="px-3.5 py-2.5 rounded-2xl rounded-tr-sm text-xs max-w-[80%] font-medium" style={{ backgroundColor: '#09090b', color: '#fafafa' }}>
              {item.prompt}
            </div>
          </div>
          <div className="flex justify-start gap-2">
            <div className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center mt-0.5" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-sm text-xs max-w-[85%]" style={{ backgroundColor: '#f4f4f5', color: '#3f3f46' }}>
              {item.reply}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const Hero = () => {
  const [activeTab, setActiveTab] = useState('notes');
  const desktopRelease = useDesktopDownload();

  return (
    <section
      className="relative pt-16 overflow-hidden"
      style={{
        backgroundColor: '#ffffff',
        backgroundImage: 'radial-gradient(circle, #c4c4c8 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }}
    >
      {/* Radial fade: white center, visible dots at edges — twenty.com pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 75% 65% at 50% 30%, rgba(255,255,255,1) 0%, rgba(255,255,255,0.85) 40%, rgba(255,255,255,0.3) 70%, rgba(255,255,255,0) 100%)',
        }}
      />

      {/* Soft top glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.06) 0%, transparent 70%)',
        }}
      />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12 text-center">
        {/* Badge */}
        <motion.a
          href="#"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-10 transition-all hover:scale-[1.02]"
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e4e4e7',
            color: '#3f3f46',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}
        >
          <span
            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <Sparkles className="w-2.5 h-2.5 text-white" />
          </span>
          <span>Local AI — now works fully offline</span>
          <ChevronRight className="w-3.5 h-3.5" style={{ color: '#a1a1aa' }} />
        </motion.a>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="font-black tracking-[-0.04em] leading-[0.92] mb-7"
          style={{ fontSize: 'clamp(2.8rem, 8vw, 5.5rem)' }}
        >
          <span style={{ color: '#a1a1aa', display: 'block', fontWeight: 800 }}>
            The smartest
          </span>
          <span style={{ color: '#09090b', display: 'block', fontWeight: 900 }}>
            note-taking
          </span>
          <span
            style={{
              display: 'block',
              fontWeight: 900,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 60%, #a855f7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            workspace.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-lg lg:text-xl mx-auto mb-10 max-w-[520px] leading-relaxed"
          style={{ color: '#71717a' }}
        >
          Notes, Kanban boards, and visual canvases — pre-built with templates so you start working, not setting up.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.22 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16 flex-wrap"
        >
          <Link
            to="/auth/sign-up"
            className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold rounded-xl transition-all hover:opacity-90 active:scale-[0.98] group"
            style={{
              backgroundColor: '#09090b',
              color: '#fafafa',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.08)',
            }}
          >
            Get Started — it&apos;s free
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>

          {desktopRelease && (
            <a
              href={desktopRelease.download_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold rounded-xl transition-all active:scale-[0.98]"
              style={{
                backgroundColor: '#ffffff',
                color: '#3f3f46',
                border: '1px solid #e4e4e7',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#d4d4d8'; e.currentTarget.style.backgroundColor = '#fafafa'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e4e4e7'; e.currentTarget.style.backgroundColor = '#ffffff'; }}
            >
              <Download className="w-4 h-4" />
              Download Desktop
            </a>
          )}
        </motion.div>

        {/* Product mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="rounded-2xl overflow-hidden relative"
          style={{
            border: '1px solid #e4e4e7',
            boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.02)',
            backgroundColor: '#ffffff',
          }}
        >
          {/* Subtle gradient top border */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.4), transparent)' }}
          />

          {/* Tab bar */}
          <div
            className="grid grid-cols-4 border-b"
            style={{ borderColor: '#e4e4e7', backgroundColor: '#fafafa' }}
          >
            {featureTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { if (!tab.comingSoon) setActiveTab(tab.id); }}
                  className="flex items-center gap-2 px-4 py-4 text-left transition-all relative"
                  style={{
                    backgroundColor: isActive ? '#ffffff' : 'transparent',
                    cursor: tab.comingSoon ? 'default' : 'pointer',
                    opacity: tab.comingSoon ? 0.55 : 1,
                  }}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div
                      className="absolute bottom-0 left-0 right-0 h-0.5"
                      style={{ background: `linear-gradient(90deg, ${tab.color}, ${tab.color}88)` }}
                    />
                  )}
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                    style={{ backgroundColor: isActive ? tab.bg : '#f4f4f5' }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: isActive ? tab.color : '#a1a1aa' }} />
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-sm font-semibold leading-tight"
                        style={{ color: tab.comingSoon ? '#a1a1aa' : isActive ? '#09090b' : '#71717a' }}
                      >
                        {tab.label}
                      </span>
                      {tab.comingSoon && (
                        <span
                          className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                          style={{ backgroundColor: '#fef9c3', color: '#a16207' }}
                        >
                          Soon
                        </span>
                      )}
                    </div>
                    <div className="text-xs leading-tight mt-0.5" style={{ color: '#a1a1aa' }}>
                      {tab.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Mockup area */}
          <div className="min-h-[280px] relative overflow-hidden" style={{ backgroundColor: '#fafafa' }}>
            {/* Mac window chrome */}
            <div
              className="flex items-center gap-2 px-4 py-3 border-b"
              style={{ borderColor: '#e4e4e7', backgroundColor: '#ffffff' }}
            >
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#fca5a5' }} />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#fcd34d' }} />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#86efac' }} />
              </div>
              <div
                className="flex-1 mx-4 h-6 rounded-md flex items-center justify-center gap-1.5"
                style={{ backgroundColor: '#f4f4f5' }}
              >
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }} />
                <span className="text-xs" style={{ color: '#a1a1aa' }}>likho.app/workspace</span>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
              >
                <HeroMockup activeTab={activeTab} />
              </motion.div>
            </AnimatePresence>

            {/* Floating collaboration badge */}
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute bottom-5 right-5 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e4e4e7',
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                color: '#3f3f46',
              }}
            >
              <div className="flex -space-x-1.5">
                {['#6366f1', '#8b5cf6'].map((c, i) => (
                  <div key={i} className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold" style={{ backgroundColor: c, border: '2px solid #fff' }}>
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <span>2 editing live</span>
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: '#22c55e' }}
              />
            </motion.div>
          </div>
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.85, duration: 0.5 }}
          className="mt-10 flex items-center justify-center gap-3"
        >
          <div className="flex -space-x-2">
            {['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4'].map((color, i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                style={{ backgroundColor: color, border: '2px solid #ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
              >
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          <p className="text-sm" style={{ color: '#71717a' }}>
            <span className="font-semibold" style={{ color: '#09090b' }}>2,000+</span> thinkers already using Likho
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
