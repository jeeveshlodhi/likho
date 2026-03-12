/**
 * Shows colored avatar circles for each connected collaborator.
 * Enhanced with role indicators and proper awareness handling.
 */
import { useState, useEffect, useMemo } from 'react';
import type { WebsocketProvider } from 'y-websocket';
import type { CollaborationRole } from '@/hooks/useCollaboration';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface AwarenessUser {
  name: string;
  color: string;
  role: CollaborationRole;
  cursor?: { blockId: string; index: number };
}

interface CollaboratorAvatarsProps {
  provider: WebsocketProvider | null;
  maxVisible?: number;
}

const ROLE_BADGES: Record<CollaborationRole, { label: string; className: string }> = {
  owner: { label: 'Owner', className: 'bg-purple-500 text-white' },
  admin: { label: 'Admin', className: 'bg-purple-500 text-white' },
  editor: { label: 'Editing', className: 'bg-green-500 text-white' },
  commenter: { label: 'Commenting', className: 'bg-blue-500 text-white' },
  viewer: { label: 'Viewing', className: 'bg-gray-500 text-white' },
};

export default function CollaboratorAvatars({ provider, maxVisible = 3 }: CollaboratorAvatarsProps) {
  const [users, setUsers] = useState<AwarenessUser[]>([]);

  useEffect(() => {
    if (!provider) return;

    const updateUsers = () => {
      const states = provider.awareness.getStates();
      const others: AwarenessUser[] = [];
      states.forEach((state: any, clientId: number) => {
        if (clientId !== provider.awareness.clientID && state.user) {
          others.push({
            name: state.user.name,
            color: state.user.color,
            role: state.user.role || 'viewer',
            cursor: state.cursor,
          });
        }
      });
      setUsers(others);
    };

    provider.awareness.on('change', updateUsers);
    updateUsers();

    return () => {
      provider.awareness.off('change', updateUsers);
    };
  }, [provider]);

  const visibleUsers = useMemo(() => users.slice(0, maxVisible), [users, maxVisible]);
  const remainingCount = Math.max(0, users.length - maxVisible);

  if (users.length === 0) return null;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        <div className="flex -space-x-2">
          {visibleUsers.map((user, i) => (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ring-2 ring-background cursor-pointer",
                    user.role === 'editor' && "ring-green-500/30",
                    user.role === 'commenter' && "ring-blue-500/30",
                    user.role === 'admin' && "ring-purple-500/30",
                  )}
                  style={{ 
                    backgroundColor: user.color,
                    color: '#fff',
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                    zIndex: visibleUsers.length - i,
                  }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="space-y-1">
                <p className="font-medium">{user.name}</p>
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full",
                  ROLE_BADGES[user.role]?.className || ROLE_BADGES.viewer.className
                )}>
                  {ROLE_BADGES[user.role]?.label || 'Viewing'}
                </span>
                {user.cursor?.blockId && (
                  <p className="text-xs text-muted-foreground">
                    Editing block {user.cursor.blockId.slice(0, 8)}…
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          ))}
          
          {remainingCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-medium ring-2 ring-background">
                  +{remainingCount}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <div className="space-y-1">
                  <p className="font-medium">{remainingCount} more</p>
                  {users.slice(maxVisible).map((u, i) => (
                    <p key={i} className="text-xs text-muted-foreground">
                      {u.name} ({u.role})
                    </p>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {users.length > 0 && (
          <span className="ml-1 text-xs text-muted-foreground">
            {users.length === 1 ? '1 person' : `${users.length} people`} editing
          </span>
        )}
      </div>
    </TooltipProvider>
  );
}
