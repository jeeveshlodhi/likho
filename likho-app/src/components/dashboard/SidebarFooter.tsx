import { LogOut, Settings, User } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '@/store/authStore';

interface SidebarFooterProps {
  collapsed: boolean;
}

export default function SidebarFooter({ collapsed }: SidebarFooterProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/auth/sign-in');
  };

  if (collapsed) {
    return (
      <div className="border-t border-neutral-200 p-2 dark:border-neutral-700">
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center rounded-md p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700"
        >
          <LogOut size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-neutral-200 p-2 dark:border-neutral-700">
      <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
          ) : (
            <User size={14} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-neutral-800 dark:text-neutral-200">
            {user?.full_name || user?.username || 'User'}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            title="Settings"
            className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-700 dark:hover:text-neutral-300"
          >
            <Settings size={14} />
          </button>
          <button
            onClick={handleLogout}
            title="Logout"
            className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-700 dark:hover:text-neutral-300"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
