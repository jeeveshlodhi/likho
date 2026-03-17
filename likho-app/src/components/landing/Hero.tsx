import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router';
import {
  FileText, LayoutGrid, Palette, Sparkles,
  ChevronRight, Lock, Database, Zap, Download,
} from 'lucide-react';
import { useDesktopDownload } from '@/hooks/useDesktopDownload';

const featureTabs = [
  {
    id: 'notes',
    icon: FileText,
    label: 'Notes',
    description: 'Rich block-based editor',
    color: '#ec4899',
    bg: '#fdf2f8',
    comingSoon: false,
  },
  {
    id: 'kanban',
    icon: Lock,
    label: 'Kanban',
    description: 'Visual task management',
    color: '#f59e0b',
    bg: '#fffbeb',
    comingSoon: false,
  },
  {
    id: 'canvas',
    icon: Database,
    label: 'Canvas',
    description: 'Freeform visual thinking',
    color: '#10b981',
    bg: '#f0fdf4',
    comingSoon: false,
  },
  {
    id: 'ai',
    icon: Zap,
    label: 'AI Assistant',
    description: 'Automate & summarize',
    color: '#06b6d4',
    bg: '#ecfeff',
    comingSoon: true,
  },
];

const HeroMockup = ({ activeTab }: { activeTab: string }) => {
  if (activeTab === 'notes') {
    return (
      <div className="p-6 space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded" style={{ backgroundColor: '#f3f4f6' }} />
          <div className="w-6 h-6 rounded" style={{ backgroundColor: '#f3f4f6' }} />
          <div className="w-6 h-6 rounded" style={{ backgroundColor: '#f3f4f6' }} />
          <div className="flex-1" />
          <div className="text-xs" style={{ color: '#9ca3af' }}>Saved</div>
        </div>
        <div className="h-7 rounded-lg w-2/3" style={{ backgroundColor: '#111827', opacity: 0.08 }} />
        <div className="h-4 rounded w-full" style={{ backgroundColor: '#f3f4f6' }} />
        <div className="h-4 rounded w-5/6" style={{ backgroundColor: '#f3f4f6' }} />
        <div className="h-4 rounded w-full" style={{ backgroundColor: '#f3f4f6' }} />
        <div className="flex items-center gap-2 mt-4">
          <div className="w-4 h-4 rounded border-2" style={{ borderColor: '#10b981' }}>
            <div className="w-2 h-2 m-0.5 rounded-sm" style={{ backgroundColor: '#10b981' }} />
          </div>
          <div className="h-4 rounded flex-1" style={{ backgroundColor: '#dcfce7' }} />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2" style={{ borderColor: '#d1d5db' }} />
          <div className="h-4 rounded flex-1" style={{ backgroundColor: '#f3f4f6' }} />
        </div>
        <div className="pl-4 py-2 mt-2" style={{ borderLeft: '3px solid #fcd34d' }}>
          <div className="h-3 rounded w-full mb-1.5" style={{ backgroundColor: '#fef9c3' }} />
          <div className="h-3 rounded w-4/5" style={{ backgroundColor: '#fef9c3' }} />
        </div>
      </div>
    );
  }

  if (activeTab === 'kanban') {
    return (
      <div className="p-5 flex gap-3 overflow-hidden">
        {[
          { label: 'To Do', count: 3, color: '#6b7280', items: ['Research phase', 'User interviews', 'Design system'] },
          { label: 'In Progress', count: 2, color: '#3b82f6', items: ['Build MVP', 'Write docs'] },
          { label: 'Done', count: 4, color: '#10b981', items: ['Setup repo', 'CI/CD'] },
        ].map((col) => (
          <div key={col.label} className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
              <span className="text-xs font-medium" style={{ color: '#374151' }}>{col.label}</span>
              <span className="text-xs" style={{ color: '#9ca3af' }}>{col.count}</span>
            </div>
            <div className="space-y-2">
              {col.items.map((item) => (
                <div
                  key={item}
                  className="p-2 rounded-lg text-xs"
                  style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', color: '#374151' }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activeTab === 'canvas') {
    return (
      <div className="p-6 relative h-full min-h-[200px]" style={{ backgroundColor: '#fafafa' }}>
        <div
          className="absolute top-8 left-8 w-24 h-16 rounded-xl flex items-center justify-center text-xs font-medium shadow-sm"
          style={{ backgroundColor: '#ede9fe', color: '#7c3aed', border: '1px solid #ddd6fe' }}
        >
          Idea A
        </div>
        <div
          className="absolute top-14 right-12 w-20 h-14 rounded-xl flex items-center justify-center text-xs font-medium shadow-sm"
          style={{ backgroundColor: '#dbeafe', color: '#1d4ed8', border: '1px solid #bfdbfe' }}
        >
          Idea B
        </div>
        <div
          className="absolute bottom-8 left-16 w-22 h-14 rounded-xl flex items-center justify-center text-xs font-medium shadow-sm"
          style={{ backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}
        >
          Idea C
        </div>
        <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.4 }}>
          <line x1="56" y1="40" x2="200" y2="42" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="4 2" />
          <line x1="100" y1="56" x2="80" y2="140" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="4 2" />
        </svg>
      </div>
    );
  }

  // AI tab
  return (
    <div className="p-5 space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: '#ecfeff' }}
        >
          <Sparkles className="w-4 h-4" style={{ color: '#06b6d4' }} />
        </div>
        <span className="text-sm font-medium" style={{ color: '#111827' }}>AI Assistant</span>
      </div>
      {[
        { prompt: 'Summarize my meeting notes', reply: 'Key decisions: Launch Q2, hire 3 engineers, migrate to new stack.' },
        { prompt: 'Suggest tags for this note', reply: '#product #roadmap #2025' },
      ].map((item, i) => (
        <div key={i} className="space-y-1.5">
          <div className="flex justify-end">
            <div className="px-3 py-2 rounded-xl text-xs max-w-[80%]" style={{ backgroundColor: '#111827', color: '#ffffff' }}>
              {item.prompt}
            </div>
          </div>
          <div className="flex justify-start">
            <div className="px-3 py-2 rounded-xl text-xs max-w-[85%]" style={{ backgroundColor: '#f3f4f6', color: '#374151' }}>
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
      className="relative pt-14"
      style={{
        backgroundColor: '#ffffff',
        backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
        backgroundSize: '22px 22px',
      }}
    >
      {/* Fade overlay so dots fade out at bottom */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,255,255,0) 0%, rgba(255,255,255,0.7) 60%, rgba(255,255,255,1) 100%)',
        }}
      />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 text-center">
        {/* Badge */}
        <motion.a
          href="#"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-8 transition-opacity hover:opacity-80"
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            color: '#374151',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          <Sparkles className="w-3.5 h-3.5" style={{ color: '#8b5cf6' }} />
          <span>Now with local AI — works offline too</span>
          <ChevronRight className="w-3.5 h-3.5" style={{ color: '#9ca3af' }} />
        </motion.a>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-bold tracking-tight leading-none mb-6"
          style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)' }}
        >
          <span style={{ color: '#9ca3af', display: 'block', fontWeight: 700 }}>
            The smartest
          </span>
          <span style={{ color: '#111827', display: 'block', fontWeight: 800 }}>
            note-taking workspace
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg mx-auto mb-10 max-w-xl"
          style={{ color: '#6b7280' }}
        >
          Notes, Kanban boards, and visual canvases — already structured with templates so you can start working instantly.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16 flex-wrap"
        >
          <Link
            to="/auth/sign-up"
            className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold rounded-xl transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#111827', color: '#ffffff', boxShadow: '0 1px 2px rgba(0,0,0,0.15)' }}
          >
            Get Started
          </Link>
          <a
            href={desktopRelease?.download_url ?? '/download'}
            {...(desktopRelease?.download_url
              ? { target: '_blank', rel: 'noopener noreferrer' }
              : {})}
            className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold rounded-xl transition-opacity hover:opacity-90"
            style={{
              backgroundColor: '#ffffff',
              color: '#374151',
              border: '1px solid #d1d5db',
              boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
            }}
          >
            <Download className="w-4 h-4" />
            Download Tauro (Desktop)
          </a>
          <button
            onClick={() => document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' })}
            className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold rounded-xl transition-colors"
            style={{
              backgroundColor: '#ffffff',
              color: '#374151',
              border: '1px solid #d1d5db',
              boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
            }}
          >
            See how it works
          </button>
        </motion.div>

        {/* Feature tabs + product preview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="rounded-2xl overflow-hidden"
          style={{
            border: '1px solid #e5e7eb',
            boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
            backgroundColor: '#ffffff',
          }}
        >
          {/* Tab bar */}
          <div
            className="grid grid-cols-4 border-b"
            style={{ borderColor: '#e5e7eb', backgroundColor: '#fafafa' }}
          >
            {featureTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { if (!tab.comingSoon) setActiveTab(tab.id); }}
                  className="flex items-center gap-2 px-4 py-4 text-left transition-colors relative"
                  style={{
                    backgroundColor: isActive ? '#ffffff' : 'transparent',
                    borderBottom: isActive ? `2px solid ${tab.color}` : '2px solid transparent',
                    cursor: tab.comingSoon ? 'default' : 'pointer',
                    opacity: tab.comingSoon ? 0.6 : 1,
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: isActive ? tab.bg : '#f3f4f6' }}
                  >
                    <Icon className="w-4 h-4" style={{ color: isActive ? tab.color : '#9ca3af' }} />
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-sm font-semibold leading-tight"
                        style={{ color: tab.comingSoon ? '#9ca3af' : isActive ? '#111827' : '#6b7280' }}
                      >
                        {tab.label}
                      </span>
                      {tab.comingSoon && (
                        <span
                          className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
                          style={{ backgroundColor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}
                        >
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          Soon
                        </span>
                      )}
                    </div>
                    <div className="text-xs leading-tight" style={{ color: '#9ca3af' }}>
                      {tab.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Product mockup area */}
          <div className="min-h-[280px] relative overflow-hidden" style={{ backgroundColor: '#fafafa' }}>
            {/* Mac-style window chrome */}
            <div
              className="flex items-center gap-2 px-4 py-3 border-b"
              style={{ borderColor: '#e5e7eb', backgroundColor: '#ffffff' }}
            >
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#fca5a5' }} />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#fcd34d' }} />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#86efac' }} />
              </div>
              <div
                className="flex-1 mx-4 h-6 rounded-md flex items-center justify-center"
                style={{ backgroundColor: '#f3f4f6' }}
              >
                <span className="text-xs" style={{ color: '#9ca3af' }}>likho.app/dashboard</span>
              </div>
            </div>

            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <HeroMockup activeTab={activeTab} />
            </motion.div>

            {/* Floating collaboration badge */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                color: '#374151',
              }}
            >
              <div className="flex -space-x-1.5">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold" style={{ backgroundColor: '#6366f1', border: '2px solid #fff' }}>A</div>
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold" style={{ backgroundColor: '#8b5cf6', border: '2px solid #fff' }}>B</div>
              </div>
              2 collaborating live
            </motion.div>
          </div>
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-10 flex items-center justify-center gap-3"
        >
          <div className="flex -space-x-2">
            {['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4'].map((color, i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                style={{ backgroundColor: color, border: '2px solid #ffffff' }}
              >
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          <p className="text-sm" style={{ color: '#6b7280' }}>
            <span className="font-semibold" style={{ color: '#111827' }}>2,000+</span> thinkers already using Likho
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
