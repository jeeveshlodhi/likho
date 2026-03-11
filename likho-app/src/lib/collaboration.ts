/**
 * @deprecated This file is deprecated. Use `useCollaboration` from `@/hooks/useCollaboration` instead.
 * 
 * The new hook provides:
 * - Permission-aware collaboration (viewers cannot edit)
 * - Role-based access control
 * - Better error handling
 * - React Query integration
 * 
 * Example migration:
 * 
 * Before:
 *   import { createCollaborationProvider } from '@/lib/collaboration';
 *   const session = createCollaborationProvider(pageId, token, userName);
 * 
 * After:
 *   import { useCollaboration } from '@/hooks/useCollaboration';
 *   const { provider, isReadOnly, canEdit, canComment } = useCollaboration({
 *     pageId,
 *     enabled: true
 *   });
 */

/**
 * Yjs collaboration provider for real-time editing of online notes.
 * Creates a Y.Doc and connects via WebSocket to the backend relay server.
 * 
 * @deprecated Use `useCollaboration` hook instead.
 */
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

const WS_BASE = import.meta.env.VITE_WS_BASE || 'ws://localhost:8000';

// Random color for user cursor
const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#82E0AA',
];

function getRandomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

export interface CollaborationUser {
  name: string;
  color: string;
}

export interface CollaborationSession {
  doc: Y.Doc;
  provider: WebsocketProvider;
  user: CollaborationUser;
}

/**
 * @deprecated Use `useCollaboration` hook from `@/hooks/useCollaboration` instead.
 */
export function createCollaborationProvider(
  pageId: string,
  token: string,
  userName: string
): CollaborationSession {
  console.warn('createCollaborationProvider is deprecated. Use useCollaboration hook instead.');
  
  const doc = new Y.Doc();
  const user: CollaborationUser = {
    name: userName,
    color: getRandomColor(),
  };

  const provider = new WebsocketProvider(
    WS_BASE,
    `ws/collab/${pageId}`,
    doc,
    {
      params: { token },
      connect: true,
    }
  );

  provider.awareness.setLocalStateField('user', user);

  return { doc, provider, user };
}

/**
 * @deprecated Use `useCollaboration` hook from `@/hooks/useCollaboration` instead.
 */
export function destroyCollaborationProvider(session: CollaborationSession) {
  session.provider.awareness.setLocalState(null);
  session.provider.disconnect();
  session.provider.destroy();
  session.doc.destroy();
}
