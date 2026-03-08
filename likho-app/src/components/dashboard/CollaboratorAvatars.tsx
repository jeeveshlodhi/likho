/**
 * Shows colored avatar circles for each connected collaborator.
 * Reads awareness states from the Yjs WebSocket provider.
 */
import { useState, useEffect } from 'react';
import type { WebsocketProvider } from 'y-websocket';

interface CollaboratorAvatarsProps {
  provider: WebsocketProvider | null;
}

interface AwarenessUser {
  name: string;
  color: string;
}

export default function CollaboratorAvatars({ provider }: CollaboratorAvatarsProps) {
  const [users, setUsers] = useState<AwarenessUser[]>([]);

  useEffect(() => {
    if (!provider) return;

    function update() {
      const states = provider!.awareness.getStates();
      const others: AwarenessUser[] = [];
      states.forEach((state, clientId) => {
        if (clientId !== provider!.awareness.clientID && state.user) {
          others.push(state.user as AwarenessUser);
        }
      });
      setUsers(others);
    }

    provider.awareness.on('change', update);
    update();

    return () => {
      provider.awareness.off('change', update);
    };
  }, [provider]);

  if (users.length === 0) return null;

  return (
    <div className="flex items-center gap-1">
      {users.map((user, i) => (
        <div
          key={i}
          title={user.name}
          className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
          style={{ backgroundColor: user.color }}
        >
          {user.name.charAt(0).toUpperCase()}
        </div>
      ))}
      <span className="ml-1 text-xs text-muted-foreground">
        {users.length} editing
      </span>
    </div>
  );
}
