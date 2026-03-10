import { useState } from 'react';
import {
  PanelRightClose, PanelRight,
  Link2, Network, Wand2, Info,
  Tag, FileText, Clock, LayoutGrid,
  Cpu, Cloud, CalendarDays, BookOpen,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
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

const TAB_META: Record<SidebarTab, { icon: React.ReactNode; label: string }> = {
  info:      { icon: <Info size={14} />,          label: 'Info' },
  ai:        { icon: <Wand2 size={14} />,         label: 'AI' },
  meeting:   { icon: <CalendarDays size={14} />,  label: 'Meeting' },
  insights:  { icon: <BookOpen size={14} />,      label: 'Insights' },
  backlinks: { icon: <Link2 size={14} />,         label: 'Links' },
  related:   { icon: <Network size={14} />,       label: 'Related' },
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
      icon: <LayoutGrid size={13} />,
      label: 'Type',
      value: pageTypeLabels[note.pageType ?? 'note'] ?? 'Note',
    },
    {
      icon: <FileText size={13} />,
      label: 'Words',
      value: wordCount(contentText).toLocaleString(),
    },
    {
      icon: <Clock size={13} />,
      label: 'Created',
      value: note.createdAt
        ? format(parseISO(note.createdAt), 'MMM d, yyyy')
        : '—',
    },
    {
      icon: <Clock size={13} />,
      label: 'Edited',
      value: note.updatedAt
        ? format(parseISO(note.updatedAt), 'MMM d, h:mm a')
        : '—',
    },
  ];

  return (
    <div className="space-y-5 p-3">
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-1.5">
        {stats.map(({ icon, label, value }) => (
          <div
            key={label}
            className="flex flex-col gap-0.5 rounded-xl bg-muted/40 px-2.5 py-2"
          >
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wider">
              {icon}
              {label}
            </div>
            <span className="text-sm font-semibold text-foreground truncate">{value}</span>
          </div>
        ))}
      </div>

      {/* Tags */}
      <div>
        <div className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          <Tag size={10} />
          Tags
        </div>
        {accepted.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {accepted.map((t) => (
              <span
                key={t}
                className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary"
              >
                {t}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            No tags yet — use the AI tab to classify.
          </p>
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
      <div className="flex gap-1 p-3 pb-0">
        {(['cloud', 'local'] as AiSubTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setSub(t)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-colors
              ${sub === t
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
          >
            {t === 'cloud' ? <Cloud size={12} /> : <Cpu size={12} />}
            {t === 'cloud' ? 'Cloud' : 'Local'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {sub === 'cloud' ? (
          <>
            <section>
              <SectionHeader icon={<Wand2 size={12} />} label="Writing Assist" />
              <CloudWritingAssist
                noteId={note.id}
                content={contentText}
                getSelectedText={getSelectedText}
                onApply={onApplyText}
                pageType={note.pageType}
              />
            </section>
            <div className="border-t border-border" />
            <section>
              <SectionHeader icon={<Tag size={12} />} label="Auto-tagging" />
              <AutoTagPanel
                noteId={note.id}
                title={note.title}
                contentText={contentText}
              />
            </section>
          </>
        ) : (
          <AiWritingPanel
            noteId={note.id}
            getSelectedText={getSelectedText}
            onApply={onApplyText}
            onTitleApply={onApplyTitle ?? (() => {})}
          />
        )}
      </div>
    </div>
  );
}

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="mb-2.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
      {icon}
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
}: RightSidebarProps) {
  const tabs = availableTabs ?? TABS_FOR_TYPE[note.pageType ?? 'note'] ?? ['info', 'ai'];
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<SidebarTab>(tabs[0] ?? 'info');

  // Ensure activeTab is always in available tabs
  const safeTab = tabs.includes(activeTab) ? activeTab : tabs[0];

  return (
    <div
      className={`
        flex flex-col border-l border-border bg-sidebar transition-all duration-200
        ${collapsed ? 'w-12' : 'w-72'}
      `}
    >
      {collapsed ? (
        /* ── Collapsed rail ── */
        <div className="flex flex-col items-center gap-1 pt-2 px-1">
          <button
            onClick={() => setCollapsed(false)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            title="Expand panel"
          >
            <PanelRight size={16} />
          </button>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => { setCollapsed(false); setActiveTab(tab); }}
              className={`rounded-lg p-2 transition-colors ${
                safeTab === tab
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
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
          <div className="flex shrink-0 items-center border-b border-border">
            <div className="flex flex-1 overflow-x-auto scrollbar-none">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex flex-1 min-w-0 items-center justify-center gap-1 py-2.5 text-[11px] font-medium whitespace-nowrap transition-colors
                    ${safeTab === tab
                      ? 'border-b-2 border-primary text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  {TAB_META[tab].icon}
                  <span>{TAB_META[tab].label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setCollapsed(true)}
              className="shrink-0 p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              title="Collapse"
            >
              <PanelRightClose size={15} />
            </button>
          </div>

          {/* ── Tab content ── */}
          <div className="flex-1 overflow-hidden">
            {safeTab === 'info' && (
              <div className="h-full overflow-y-auto">
                <InfoTab note={note} contentText={contentText} />
              </div>
            )}
            {safeTab === 'ai' && (
              <AiTab
                note={note}
                contentText={contentText}
                getSelectedText={getSelectedText}
                onApplyText={onApplyText}
                onApplyTitle={onApplyTitle}
              />
            )}
            {safeTab === 'meeting' && (
              <div className="h-full overflow-y-auto p-3">
                <MeetingInsightsPanel
                  noteTitle={note.title}
                  contentText={contentText}
                />
              </div>
            )}
            {safeTab === 'insights' && (
              <div className="h-full overflow-y-auto p-3">
                <JournalInsightsPanel />
              </div>
            )}
            {safeTab === 'backlinks' && (
              <div className="h-full overflow-y-auto">
                <BacklinksPanel noteId={note.id} />
              </div>
            )}
            {safeTab === 'related' && (
              <div className="h-full overflow-y-auto space-y-1">
                {/* Local related notes (llama.cpp) */}
                <RelatedNotesPanel noteId={note.id} />
                {/* AI link suggestions (cloud) */}
                <div className="border-t border-border mx-3" />
                <div className="p-3">
                  <SuggestLinksPanel
                    noteId={note.id}
                    noteTitle={note.title}
                    contentText={contentText}
                  />
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
