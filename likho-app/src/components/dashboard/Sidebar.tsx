import { PanelLeftClose, PanelLeft, Link2, Hash, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useAuthStore } from '@/store/authStore';
import SpaceSection from './SpaceSection';
import SidebarFooter from './SidebarFooter';
import { isTauri } from '@/utils/platform';
import { SidebarSearch } from '@/components/search';
import { AutoGroupButton } from '@/components/ai';

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useWorkspaceStore();
  const { isAuthenticated, isGuest } = useAuthStore();
  const showOnlineSpace = isAuthenticated && !isGuest;
  const navigate = useNavigate();

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
            {isTauri() && <div className="my-1 border-t border-sidebar-border" />}
          </>
        )}
        {isTauri() && <SpaceSection spaceType="offline" />}

        {/* Knowledge Graph Navigation */}
        <div className="mt-4 border-t border-sidebar-border pt-3">
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
        </div>
      </div>

      {/* Footer */}
      <SidebarFooter collapsed={false} />
    </div>
  );
}
