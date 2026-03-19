import type { WebsocketProvider } from 'y-websocket';
import type { SaveStatus } from '@/hooks/useAutoSave';

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
  saveStatus: SaveStatus;
  notes: any[];
  folders: any[];
  scanNoteForLinks: (note: any, notes: any[], folders: any[]) => void;
}
