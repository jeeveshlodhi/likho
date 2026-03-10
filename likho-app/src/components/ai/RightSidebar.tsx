import { useState } from 'react';
import {
  PanelRightClose, PanelRight,
  Link2, Network, Wand2, Info,
  Tag, FileText, Clock, LayoutGrid,
  Cpu, Cloud, CalendarDays, BookOpen,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { BacklinksPanel } from '@/components/dashboard/editor/BacklinksPanel';
import { RelatedNotesPanel } from '@/components/ai/RelatedNotesPanel';
import { AiWritingPanel } from '@/components/ai/AiWritingPanel';
import { CloudWritingAssist } from '@/components/ai/CloudWritingAssist';
import { AutoTagPanel } from '@/components/ai/AutoTagPanel';
import { MeetingInsightsPanel } from '@/components/ai/MeetingInsightsPanel';
import { SuggestLinksPanel } from '@/components/ai/SuggestLinksPanel';
import { JournalInsightsPanel } from '@/components/ai/JournalInsightsPanel';
import { useNoteMetaStore } from '@/store/noteMetaStore';
import type { Note } from '@/types/workspace';

export type SidebarTab = 'info' | 'ai' | 'meeting' | 'insights' | 'backlinks' | 'related';

interface RightSidebarProps {
  note: Note;
  /** Plain text for cloud AI (pass empty string for canvas/kanban) */
  contentText: string;
  getSelectedText: () => string;
  onApplyText: (text: string) => void;
  onApplyTitle?: (title: string) => void;
  /** Which tabs to show — defaults based on pageType */
  availableTabs?: SidebarTab[];
  /** Start collapsed (default: false) */
  defaultCollapsed?: boolean;
}

// Tabs available per page type
const TABS_FOR_TYPE: Record<string, SidebarTab[]> = {
  note:          ['info', 'ai', 'backlinks', 'related'],
  meeting:       ['info', 'meeting', 'ai', 'backlinks', 'related'],
  project:       ['info', 'ai', 'backlinks', 'related'],
  journal:       ['info', 'insights', 'ai'],
  documentation: ['info', 'ai', 'backlinks', 'related'],
  brainstorm:    ['info', 'ai'],
  canvas:        ['info', 'ai'],
  kanban:        ['info', 'ai'],
};

const TAB_META: Record<SidebarTab, { icon: React.ReactNode; label: string; color: string }> = {
  info:      { icon: <Info size={14} />,          label: 'Info',     color: 'from-zinc-500 to-zinc-600' },
  ai:        { icon: <Wand2 size={14} />,         label: 'AI',       color: 'from-indigo-500 to-purple-600' },
  meeting:   { icon: <CalendarDays size={14} />,  label: 'Meeting',  color: 'from-blue-500 to-cyan-600' },
  insights:  { icon: <BookOpen size={14} />,      label: 'Insights', color: 'from-emerald-500 to-teal-600' },
  backlinks: { icon: <Link2 size={14} />,         label: 'Links',    color: 'from-orange-500 to-amber-600' },
  related:   { icon: <Network size={14} />,       label: 'Related',  color: 'from-pink-500 to-rose-600' },
};

type AiSubTab = 'cloud' | 'local';

function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function InfoTab({ note, contentText }: { note: Note; contentText: string }) {
  const meta = useNoteMetaStore((s) => s.getMeta(note.id));
  const accepted = meta?.acceptedTags ?? [];

  const pageTypeLabels: Record<string, string> = {
    note: 'Note', meeting: 'Meeting', project: 'Project',
    journal: 'Journal', documentation: 'Docs', canvas: 'Canvas',
    brainstorm: 'Brainstorm', kanban: 'Kanban',
  };

  const stats = [
    {
      icon: <LayoutGrid size={14} />,
      label: 'Type',
      value: pageTypeLabels[note.pageType ?? 'note'] ?? 'Note',
    },
    {
      icon: <FileText size={14} />,
      label: 'Words',
      value: wordCount(contentText).toLocaleString(),
    },
    {
      icon: <Clock size={14} />,
      label: 'Created',
      value: note.createdAt
        ? format(parseISO(note.createdAt), 'MMM d, yyyy')
        : '—',
    },
    {
      icon: <Clock size={14} />,
      label: 'Edited',
      value: note.updatedAt
        ? format(parseISO(note.updatedAt), 'MMM d, h:mm a')
        : '—',
    },
  ];

  return (
    <div className="space-y-5 p-4">
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        {stats.map(({ icon, label, value }) => (
          <div
            key={label}
            className="flex flex-col gap-1 rounded-xl 
              bg-white dark:bg-zinc-800/50 
              border border-zinc-200 dark:border-zinc-700/50
              px-3 py-2.5 shadow-sm"
          >
            <div className="flex items-center gap-1.5 text-[10px] 
              text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              {icon}
              {label}
            </div>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Tags */}
      <div>
        <div className="mb-2.5 flex items-center gap-2 
          text-[10px] font-semibold uppercase tracking-wider 
          text-zinc-500 dark:text-zinc-400">
          <Tag size={11} />
          Tags
        </div>
        {accepted.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {accepted.map((t) => (
              <span
                key={t}
                className="rounded-full bg-indigo-50 dark:bg-indigo-500/15
                  border border-indigo-100 dark:border-indigo-500/20
                  px-3 py-1 text-[11px] font-medium 
                  text-indigo-700 dark:text-indigo-400"
              >
                {t}
              </span>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/30 
            border border-dashed border-zinc-200 dark:border-zinc-700
            p-4 text-center">
            <Tag size={16} className="mx-auto mb-1.5 text-zinc-400" />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              No tags yet
            </p>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
              Use the AI tab to classify
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function AiTab({
  note,
  contentText,
  getSelectedText,
  onApplyText,
  onApplyTitle,
}: {
  note: Note;
  contentText: string;
  getSelectedText: () => string;
  onApplyText: (text: string) => void;
  onApplyTitle?: (title: string) => void;
}) {
  const [sub, setSub] = useState<AiSubTab>('cloud');

  return (
    <div className="flex flex-col h-full">
      {/* Cloud / Local toggle */}
      <div className="flex gap-1.5 p-4 pb-2">
        {(['cloud', 'local'] as AiSubTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setSub(t)}
            className={`flex flex-1 items-center justify-center gap-2 
              rounded-xl py-2 text-xs font-semibold transition-all duration-200
              ${sub === t
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 border border-zinc-200 dark:border-zinc-700'
              }`}
          >
            {t === 'cloud' ? <Cloud size={12} /> : <Cpu size={12} />}
            {t === 'cloud' ? 'Cloud AI' : 'Local AI'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {sub === 'cloud' ? (
          <>
            <section>
              <SectionHeader icon={<Wand2 size={12} />} label="Writing Assist" />
              <div className="rounded-xl bg-white dark:bg-zinc-800/50 
                border border-zinc-200 dark:border-zinc-700/50 p-3 shadow-sm">
                <CloudWritingAssist
                  noteId={note.id}
                  content={contentText}
                  getSelectedText={getSelectedText}
                  onApply={onApplyText}
                  pageType={note.pageType}
                />
              </div>
            </section>
            <div className="border-t border-zinc-200 dark:border-zinc-700/50" />
            <section>
              <SectionHeader icon={<Tag size={12} />} label="Auto-tagging" />
              <div className="rounded-xl bg-white dark:bg-zinc-800/50 
                border border-zinc-200 dark:border-zinc-700/50 p-3 shadow-sm">
                <AutoTagPanel
                  noteId={note.id}
                  title={note.title}
                  contentText={contentText}
                />
              </div>
            </section>
          </>
        ) : (
          <div className="rounded-xl bg-white dark:bg-zinc-800/50 
            border border-zinc-200 dark:border-zinc-700/50 p-3 shadow-sm">
            <AiWritingPanel
              noteId={note.id}
              getSelectedText={getSelectedText}
              onApply={onApplyText}
              onTitleApply={onApplyTitle ?? (() => {})}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="mb-2.5 flex items-center gap-2 
      text-[10px] font-bold uppercase tracking-wider 
      text-zinc-500 dark:text-zinc-400">
      <span className="flex h-5 w-5 items-center justify-center rounded-md 
        bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
        {icon}
      </span>
      {label}
    </div>
  );
}

export function RightSidebar({
  note,
  contentText,
  getSelectedText,
  onApplyText,
  onApplyTitle,
  availableTabs,
  defaultCollapsed = false,
}: RightSidebarProps) {
  const tabs = availableTabs ?? TABS_FOR_TYPE[note.pageType ?? 'note'] ?? ['info', 'ai'];
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [activeTab, setActiveTab] = useState<SidebarTab>(tabs[0] ?? 'info');

  // Ensure activeTab is always in available tabs
  const safeTab = tabs.includes(activeTab) ? activeTab : tabs[0];

  return (
    <div
      className={`
        flex flex-col border-l border-zinc-200 dark:border-zinc-800 
        bg-zinc-50 dark:bg-zinc-900 transition-all duration-200
        ${collapsed ? 'w-14' : 'w-80'}
      `}
    >
      {collapsed ? (
        /* ── Collapsed rail ── */
        <div className="flex flex-col items-center gap-1 pt-3 px-2">
          <button
            onClick={() => setCollapsed(false)}
            className="rounded-xl p-2.5 text-zinc-500 hover:bg-white 
              hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 
              dark:hover:text-zinc-100 transition-all duration-200 
              shadow-sm hover:shadow-md mb-1"
            title="Expand panel"
          >
            <PanelRight size={18} />
          </button>
          <div className="w-full h-px bg-zinc-200 dark:bg-zinc-800 my-1" />
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => { setCollapsed(false); setActiveTab(tab); }}
              className={`rounded-xl p-2.5 transition-all duration-200 ${
                safeTab === tab
                  ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'text-zinc-500 hover:bg-white hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
              }`}
              title={TAB_META[tab].label}
            >
              {TAB_META[tab].icon}
            </button>
          ))}
        </div>
      ) : (
        <>
          {/* ── Header / Tab bar ── */}
          <div className="flex shrink-0 items-center border-b border-zinc-200 dark:border-zinc-800
            bg-white dark:bg-zinc-900">
            <div className="flex flex-1 overflow-x-auto scrollbar-none">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex flex-1 min-w-0 items-center justify-center gap-1.5 
                    py-3 text-[11px] font-semibold whitespace-nowrap transition-all duration-200
                    ${safeTab === tab
                      ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-500/5'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    }`}
                >
                  <span className={`${safeTab === tab ? 'text-indigo-500 dark:text-indigo-400' : ''}`}>
                    {TAB_META[tab].icon}
                  </span>
                  <span>{TAB_META[tab].label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setCollapsed(true)}
              className="shrink-0 p-2.5 text-zinc-400 hover:text-zinc-600 
                hover:bg-zinc-100 dark:text-zinc-500 dark:hover:text-zinc-300 
                dark:hover:bg-zinc-800 transition-colors"
              title="Collapse"
            >
              <PanelRightClose size={16} />
            </button>
          </div>

          {/* ── Tab content ── */}
          <div className="flex-1 overflow-hidden bg-zinc-50/50 dark:bg-zinc-900/50">
            <AnimatePresence mode="wait">
              {safeTab === 'info' && (
                <motion.div
                  key="info"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="h-full overflow-y-auto"
                >
                  <InfoTab note={note} contentText={contentText} />
                </motion.div>
              )}
              {safeTab === 'ai' && (
                <motion.div
                  key="ai"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="h-full"
                >
                  <AiTab
                    note={note}
                    contentText={contentText}
                    getSelectedText={getSelectedText}
                    onApplyText={onApplyText}
                    onApplyTitle={onApplyTitle}
                  />
                </motion.div>
              )}
              {safeTab === 'meeting' && (
                <motion.div
                  key="meeting"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="h-full overflow-y-auto p-4"
                >
                  <div className="rounded-xl bg-white dark:bg-zinc-800/50 
                    border border-zinc-200 dark:border-zinc-700/50 p-3 shadow-sm">
                    <MeetingInsightsPanel
                      noteTitle={note.title}
                      contentText={contentText}
                    />
                  </div>
                </motion.div>
              )}
              {safeTab === 'insights' && (
                <motion.div
                  key="insights"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="h-full overflow-y-auto p-4"
                >
                  <div className="rounded-xl bg-white dark:bg-zinc-800/50 
                    border border-zinc-200 dark:border-zinc-700/50 p-3 shadow-sm">
                    <JournalInsightsPanel />
                  </div>
                </motion.div>
              )}
              {safeTab === 'backlinks' && (
                <motion.div
                  key="backlinks"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="h-full overflow-y-auto p-4"
                >
                  <div className="rounded-xl bg-white dark:bg-zinc-800/50 
                    border border-zinc-200 dark:border-zinc-700/50 shadow-sm overflow-hidden">
                    <BacklinksPanel noteId={note.id} />
                  </div>
                </motion.div>
              )}
              {safeTab === 'related' && (
                <motion.div
                  key="related"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="h-full overflow-y-auto space-y-3 p-4"
                >
                  {/* Local related notes (llama.cpp) */}
                  <div className="rounded-xl bg-white dark:bg-zinc-800/50 
                    border border-zinc-200 dark:border-zinc-700/50 shadow-sm overflow-hidden">
                    <RelatedNotesPanel noteId={note.id} />
                  </div>
                  {/* AI link suggestions (cloud) */}
                  <div className="rounded-xl bg-white dark:bg-zinc-800/50 
                    border border-zinc-200 dark:border-zinc-700/50 p-3 shadow-sm">
                    <SuggestLinksPanel
                      noteId={note.id}
                      noteTitle={note.title}
                      contentText={contentText}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
}
