import { Search, PanelLeftClose, PanelLeft } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import SpaceSection from './SpaceSection';
import SidebarFooter from './SidebarFooter';

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useWorkspaceStore();

  if (sidebarCollapsed) {
    return (
      <div className="flex h-full w-12 flex-col border-r border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900">
        <div className="flex items-center justify-center p-2">
          <button
            onClick={toggleSidebar}
            className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700"
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
    <div className="flex h-full flex-col bg-neutral-50 dark:bg-neutral-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-2.5 dark:border-neutral-700">
        <span className="text-sm font-bold text-neutral-800 dark:text-neutral-100">
          Likho
        </span>
        <div className="flex items-center gap-1">
          <button
            className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600 dark:hover:bg-neutral-700 dark:hover:text-neutral-300"
            title="Search"
          >
            <Search size={16} />
          </button>
          <button
            onClick={toggleSidebar}
            className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600 dark:hover:bg-neutral-700 dark:hover:text-neutral-300"
            title="Collapse sidebar"
          >
            <PanelLeftClose size={16} />
          </button>
        </div>
      </div>

      {/* Spaces */}
      <div className="flex-1 overflow-y-auto px-1.5 py-2">
        <SpaceSection spaceType="online" />
        <div className="my-1 border-t border-neutral-200 dark:border-neutral-700" />
        <SpaceSection spaceType="offline" />
      </div>

      {/* Footer */}
      <SidebarFooter collapsed={false} />
    </div>
  );
}
