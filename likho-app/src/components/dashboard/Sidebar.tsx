import { PanelLeftClose, PanelLeft, Link2, Hash, Share2, Clock, Plus, Activity, MessageSquare, BarChart3, Users } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useAuthStore } from '@/store/authStore';
import SpaceSection from './SpaceSection';
import SidebarFooter from './SidebarFooter';
import { isTauri } from '@/utils/platform';
import { SidebarSearch } from '@/components/search';
import { AutoGroupButton } from '@/components/ai';
import { useTempNotesStore } from '@/store/tempNotesStore';
import { isBefore, parseISO } from 'date-fns';
import { useSharedWithMe } from '@/hooks/useSharedWithMe';

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useWorkspaceStore();
  const { isAuthenticated, isGuest } = useAuthStore();
  const showOnlineSpace = isAuthenticated && !isGuest;
  const navigate = useNavigate();
  const { notes: tempNotes, setQuickCaptureOpen } = useTempNotesStore();
  const { data: sharedWithMe = [] } = useSharedWithMe();
  const sharedCount = sharedWithMe.length;
  const now = new Date();
  const activeTempCount = tempNotes.filter(
    (n) => !n.isPermanent && !isBefore(parseISO(n.expiresAt), now)
  ).length;

  if (sidebarCollapsed) {
    return (
      <div className="flex h-full w-12 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="flex items-center justify-center p-2">
          <button
            onClick={toggleSidebar}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
            title="Expand sidebar"
          >
            <PanelLeft size={18} />
          </button>
        </div>
        <div className="flex flex-col items-center gap-2 py-2">
          <SidebarSearch collapsed />
          <button
            onClick={() => navigate('/dashboard/temp-notes')}
            title="Temp Notes"
            className="relative rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <Clock size={18} />
            {activeTempCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                {activeTempCount > 9 ? '9+' : activeTempCount}
              </span>
            )}
          </button>
          <button
            onClick={() => navigate('/dashboard/workspace-health')}
            title="Workspace Health"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <Activity size={18} />
          </button>
          {showOnlineSpace && (
            <button
              onClick={() => navigate('/dashboard/shared-with-me')}
              title="Shared with me"
              className="relative rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <Users size={18} />
              {sharedCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                  {sharedCount > 9 ? '9+' : sharedCount}
                </span>
              )}
            </button>
          )}
          <button
            onClick={() => navigate('/dashboard/ai-chat')}
            title="Ask AI (Workspace Q&A)"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <MessageSquare size={18} />
          </button>
          <button
            onClick={() => navigate('/dashboard/digest')}
            title="Note Digest"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <BarChart3 size={18} />
          </button>
        </div>
        <div className="flex-1" />
        <SidebarFooter collapsed />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-sidebar">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-sidebar-border px-3 py-2.5">
        <span className="text-sm font-bold text-sidebar-foreground">
          Likho
        </span>
        <div className="flex items-center gap-1">
          <SidebarSearch />
          <button
            onClick={toggleSidebar}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            title="Collapse sidebar"
          >
            <PanelLeftClose size={16} />
          </button>
        </div>
      </div>

      {/* Spaces */}
      <div className="flex-1 overflow-y-auto px-1.5 py-2">
        {showOnlineSpace && (
          <>
            <SpaceSection spaceType="online" />
            {/* Shared With Me — only in online mode */}
            <button
              onClick={() => navigate('/dashboard/shared-with-me')}
              className="w-full mt-0.5 flex items-center justify-between rounded-md px-2 py-1.5 text-sm text-sidebar-foreground hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-2">
                <Users size={15} className="text-muted-foreground" />
                <span>Shared with me</span>
              </div>
              {sharedCount > 0 && (
                <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary leading-none">
                  {sharedCount}
                </span>
              )}
            </button>
            {isTauri() && <div className="my-1 border-t border-sidebar-border" />}
          </>
        )}
        {isTauri() && <SpaceSection spaceType="offline" />}

        {/* Temp Notes */}
        <div className="mt-2 border-t border-sidebar-border pt-3">
          <div className="mb-1 flex items-center justify-between px-2">
            <span className="text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wider">
              Temp Notes
            </span>
            <button
              onClick={() => setQuickCaptureOpen(true)}
              title="Quick capture (⌘⇧N)"
              className="rounded-md p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <Plus size={13} />
            </button>
          </div>
          <button
            onClick={() => navigate('/dashboard/temp-notes')}
            className="w-full flex items-center justify-between rounded-md px-2 py-1.5 text-sm text-sidebar-foreground hover:bg-accent transition-colors"
          >
            <div className="flex items-center gap-2">
              <Clock size={16} />
              Quick Notes
            </div>
            {activeTempCount > 0 && (
              <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary leading-none">
                {activeTempCount}
              </span>
            )}
          </button>
        </div>

        {/* Knowledge Graph Navigation */}
        <div className="mt-2 border-t border-sidebar-border pt-3">
          <div className="mb-2 px-2 text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wider">
            Knowledge Graph
          </div>
          <button
            onClick={() => navigate('/dashboard/graph')}
            className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground hover:bg-accent transition-colors"
          >
            <Share2 size={16} />
            Graph View
          </button>
          <button
            onClick={() => navigate('/dashboard/tags')}
            className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground hover:bg-accent transition-colors"
          >
            <Hash size={16} />
            Tags
          </button>
          <button
            onClick={() => navigate('/dashboard/links')}
            className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground hover:bg-accent transition-colors"
          >
            <Link2 size={16} />
            Links
          </button>
          <AutoGroupButton />
          <button
            onClick={() => navigate('/dashboard/workspace-health')}
            className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground hover:bg-accent transition-colors"
          >
            <Activity size={16} />
            Workspace Health
          </button>
          <button
            onClick={() => navigate('/dashboard/ai-chat')}
            className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground hover:bg-accent transition-colors"
          >
            <MessageSquare size={16} />
            Ask AI
          </button>
          <button
            onClick={() => navigate('/dashboard/digest')}
            className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground hover:bg-accent transition-colors"
          >
            <BarChart3 size={16} />
            Note Digest
          </button>
        </div>
      </div>

      {/* Footer */}
      <SidebarFooter collapsed={false} />
    </div>
  );
}
