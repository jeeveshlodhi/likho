import type { WebsocketProvider } from 'y-websocket';

export interface NoteEditorBodyProps {
  note: any;
  noteId: string;
  provider: WebsocketProvider | null;
  isReadOnly: boolean;
  canComment: boolean;
  canCollab: boolean;
  canShare: boolean;
  users: any[];
  error: string | null;
  isConnected: boolean;
  comments: any[];
  shareOpen: boolean;
  setShareOpen: (v: boolean) => void;
  showComments: boolean;
  setShowComments: (v: boolean) => void;
  save: (updates: any) => void;
  notes: any[];
  folders: any[];
  scanNoteForLinks: (note: any, notes: any[], folders: any[]) => void;
}
