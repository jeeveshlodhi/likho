import { LogIn, LogOut, Settings, User } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/shared/ThemeToggle';

interface SidebarFooterProps {
  collapsed: boolean;
}

export default function SidebarFooter({ collapsed }: SidebarFooterProps) {
  const navigate = useNavigate();
  const { user, isGuest, logout } = useAuthStore();
  const { mutate: doLogout } = useLogout();

  const handleLogout = () => {
    doLogout(undefined, {
      onSettled: () => {
        navigate('/auth/sign-in');
      },
    });
  };

  const handleSignIn = () => {
    logout(); // clear guest state
    navigate('/auth/sign-in');
  };

  if (collapsed) {
    return (
      <div className="border-t border-sidebar-border p-2 flex flex-col gap-2">
        <ThemeToggle showLabel={false} className="w-full justify-center" />
        {isGuest ? (
          <button
            onClick={handleSignIn}
            className="flex w-full items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent"
            title="Sign in to unlock online space"
          >
            <LogIn size={18} />
          </button>
        ) : (
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent"
          >
            <LogOut size={18} />
          </button>
        )}
      </div>
    );
  }

  if (isGuest) {
    return (
      <div className="border-t border-sidebar-border p-2">
        <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <User size={14} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-sidebar-foreground">Guest</p>
            <p className="truncate text-xs text-muted-foreground">Offline only</p>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle showLabel={false} className="p-1" />
            <button
              onClick={handleSignIn}
              title="Sign in to unlock online space"
              className="rounded px-2 py-1 text-xs font-medium text-primary hover:bg-accent"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-sidebar-border p-2">
      <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
          ) : (
            <User size={14} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-sidebar-foreground">
            {user?.full_name || user?.username || 'User'}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle showLabel={false} className="p-1" />
          <button
            onClick={() => navigate('/dashboard/settings')}
            title="Settings"
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Settings size={14} />
          </button>
          <button
            onClick={handleLogout}
            title="Logout"
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
