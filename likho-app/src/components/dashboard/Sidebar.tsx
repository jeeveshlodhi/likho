import { Search, PanelLeftClose, PanelLeft } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useAuthStore } from '@/store/authStore';
import SpaceSection from './SpaceSection';
import SidebarFooter from './SidebarFooter';
import { isTauri } from '@/utils/platform';

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useWorkspaceStore();
  const { isAuthenticated, isGuest } = useAuthStore();
  const showOnlineSpace = isAuthenticated && !isGuest;

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
          <button
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            title="Search"
          >
            <Search size={16} />
          </button>
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
      </div>

      {/* Footer */}
      <SidebarFooter collapsed={false} />
    </div>
  );
}
