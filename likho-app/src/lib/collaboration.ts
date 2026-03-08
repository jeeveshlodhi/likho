/**
 * Yjs collaboration provider for real-time editing of online notes.
 * Creates a Y.Doc and connects via WebSocket to the backend relay server.
 */
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

const WS_BASE = 'ws://localhost:8000';

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

export function createCollaborationProvider(
  pageId: string,
  token: string,
  userName: string
): CollaborationSession {
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

export function destroyCollaborationProvider(session: CollaborationSession) {
  session.provider.awareness.setLocalState(null);
  session.provider.disconnect();
  session.provider.destroy();
  session.doc.destroy();
}
