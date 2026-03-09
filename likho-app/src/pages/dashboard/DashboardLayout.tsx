import { useCallback, useRef } from 'react';
import { Outlet } from 'react-router';
import { useWorkspaceStore } from '@/store/workspaceStore';
import Sidebar from '@/components/dashboard/Sidebar';
import { useOnlineSync } from '@/hooks/useOnlineSync';
import { AppShortcuts } from '@/components/search';

export default function DashboardLayout() {
  const { sidebarCollapsed, sidebarWidth, setSidebarWidth } = useWorkspaceStore();
  const resizing = useRef(false);

  // Sync online pages from backend on mount (authenticated users only)
  useOnlineSync();

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (sidebarCollapsed) return;
      e.preventDefault();
      resizing.current = true;

      const onMouseMove = (e: MouseEvent) => {
        if (resizing.current) {
          setSidebarWidth(e.clientX);
        }
      };

      const onMouseUp = () => {
        resizing.current = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [sidebarCollapsed, setSidebarWidth]
  );

  return (
    <>
      <div className="flex h-full min-h-0 bg-background">
        {/* Sidebar */}
        <div
          className="relative flex h-full min-h-0 flex-shrink-0 flex-col"
          style={{ width: sidebarCollapsed ? 48 : sidebarWidth }}
        >
          <Sidebar />
          {/* Resize handle */}
          {!sidebarCollapsed && (
            <div
              onMouseDown={handleMouseDown}
              className="absolute right-0 top-0 z-10 h-full w-1 cursor-col-resize hover:bg-primary/20"
            />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <Outlet />
        </div>
      </div>

      {/* Global Keyboard Shortcuts */}
      <AppShortcuts />
    </>
  );
}
