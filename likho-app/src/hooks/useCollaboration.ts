/**
 * Enhanced React Query hooks for real-time collaboration with permission awareness.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState, useCallback } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ui/use-toast';

export type CollaborationRole = 'viewer' | 'commenter' | 'editor' | 'admin' | 'owner';

interface CollaborationUser {
  id: string;
  name: string;
  color: string;
  role: CollaborationRole;
  cursor?: { blockId: string; index: number };
}

interface CollaborationState {
  isConnected: boolean;
  isReadOnly: boolean;
  canComment: boolean;
  canEdit: boolean;
  users: CollaborationUser[];
  error: string | null;
}

interface UseCollaborationOptions {
  pageId: string;
  enabled: boolean;
}

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#82E0AA',
];

function getRandomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

/**
 * Hook to get the user's role for a specific page
 */
export function usePageRole(pageId: string | undefined) {
  return useQuery({
    queryKey: ['page-role', pageId],
    queryFn: async () => {
      if (!pageId) return null;
      const { api } = await import('@/lib/api');
      const { data } = await api.get(`/pages/${pageId}/my-role`);
      return data.role as CollaborationRole;
    },
    enabled: !!pageId,
  });
}

/**
 * Main collaboration hook - manages WebSocket connection with permission awareness
 */
export function useCollaboration({ pageId, enabled }: UseCollaborationOptions) {
  const [state, setState] = useState<CollaborationState>({
    isConnected: false,
    isReadOnly: false,
    canComment: true,
    canEdit: true,
    users: [],
    error: null,
  });

  const sessionRef = useRef<{
    doc: Y.Doc;
    provider: WebsocketProvider;
    role: CollaborationRole;
  } | null>(null);

  // Expose provider via state so consumers re-render when it becomes available.
  // This is what allows NoteEditor to key on provider availability and remount
  // useCreateBlockNote with the correct collaboration config.
  const [providerState, setProviderState] = useState<WebsocketProvider | null>(null);

  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const { toast } = useToast();

  // Keep toast and user in refs so they never trigger a reconnect
  const toastRef = useRef(toast);
  const userRef = useRef(user);
  useEffect(() => { toastRef.current = toast; }, [toast]);
  useEffect(() => { userRef.current = user; }, [user]);

  // Get user's role first — on error, default to 'owner' so notes remain editable
  const { data: role } = usePageRole(enabled ? pageId : undefined);

  // Synchronous connect — returns a cleanup fn directly so useEffect can call it.
  // Was previously `async`, which made it return a Promise instead of the cleanup fn,
  // so old providers were never disconnected and connections piled up.
  const connect = useCallback(() => {
    if (!enabled || !accessToken || !pageId || !role) return;

    // Don't connect for viewers (they get read-only via HTTP)
    if (role === 'viewer') {
      setState(prev => ({
        ...prev,
        isReadOnly: true,
        canComment: false,
        canEdit: false,
      }));
      return;
    }

    const canEdit = ['editor', 'admin', 'owner'].includes(role);
    const canComment = ['commenter', 'editor', 'admin', 'owner'].includes(role);

    setState(prev => ({
      ...prev,
      isReadOnly: !canEdit,
      canComment,
      canEdit,
    }));

    const doc = new Y.Doc();
    const wsBase = import.meta.env.VITE_WS_BASE || 'ws://localhost:8000';

    // Create provider with connect:false so we can attach listeners before opening
    const provider = new WebsocketProvider(
      wsBase,
      `ws/collab/${pageId}?token=${encodeURIComponent(accessToken)}`,
      doc,
      { connect: false }
    );

    // Handle connection status
    provider.on('status', (event: { status: string }) => {
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          isConnected: event.status === 'connected',
          error: event.status === 'disconnected' ? 'Disconnected' : null,
        }));
      }, 0);
    });

    // Handle errors — stop auto-retry on unrecoverable failures (403, 4001, 4003, 4008)
    provider.on('connection-error', (event: any) => {
      console.error('WebSocket error:', event);
      const status = event?.status ?? event?.code;
      const unrecoverable = status === 403 || status === 401
        || status === 4001 || status === 4003 || status === 4008;
      if (unrecoverable) {
        provider.shouldConnect = false;
      }
      setTimeout(() => {
        setState(prev => ({ ...prev, error: 'Connection error', isConnected: false }));
      }, 0);
    });

    // Handle custom messages
    const handleMessage = (event: MessageEvent) => {
      if (typeof event.data === 'string') {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'permission_denied') {
            setTimeout(() => {
              toastRef.current({ title: 'Permission Denied', description: data.message, variant: 'destructive' });
              setState(prev => ({ ...prev, isReadOnly: true, canEdit: false }));
            }, 0);
          } else if (data.type === 'error') {
            setTimeout(() => {
              toastRef.current({ title: 'Error', description: data.message, variant: 'destructive' });
            }, 0);
          }
        } catch {
          // Not JSON, ignore
        }
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (provider as any).on('message', handleMessage);

    // Set awareness
    provider.awareness.setLocalStateField('user', {
      name: userRef.current?.full_name || userRef.current?.email || 'Anonymous',
      color: getRandomColor(),
      role: role,
    });

    // Listen for other users
    const updateUsers = () => {
      const states = provider.awareness.getStates();
      const users: CollaborationUser[] = [];
      states.forEach((state: any, clientId: number) => {
        if (clientId !== provider.awareness.clientID && state.user) {
          users.push({
            id: String(clientId),
            name: state.user.name,
            color: state.user.color,
            role: state.user.role,
            cursor: state.cursor,
          });
        }
      });
      setState(prev => ({ ...prev, users }));
    };

    provider.awareness.on('change', updateUsers);
    updateUsers();

    sessionRef.current = { doc, provider, role };
    // Publish to state so NoteEditor can key on provider availability
    setProviderState(provider);

    // Open the connection now that all listeners are registered
    provider.connect();

    // Return cleanup fn — called synchronously by useEffect on re-run or unmount
    return () => {
      provider.awareness.off('change', updateUsers);
      provider.disconnect();
      provider.destroy();
      doc.destroy();
      sessionRef.current = null;
      setProviderState(null);
    };
  }, [pageId, role, enabled, accessToken]); // user & toast via refs — no reconnect on change

  // When collaboration is disabled (local notes), ensure note is editable
  useEffect(() => {
    if (!enabled) {
      setState(prev => ({ ...prev, isReadOnly: false, canEdit: true, canComment: true }));
    }
  }, [enabled]);

  useEffect(() => {
    // connect() is now synchronous and returns the cleanup fn directly
    const cleanup = connect();
    return () => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [connect]);

  const addComment = useCallback(async (content: unknown, blockId?: string) => {
    if (!state.canComment) {
      toast({
        title: 'Cannot comment',
        description: 'You need commenter access to add comments',
        variant: 'destructive',
      });
      return;
    }

    const provider = sessionRef.current?.provider;
    if (!provider) return;

    // Send via WebSocket for real-time sync
    provider.ws?.send(JSON.stringify({
      type: 'comment',
      content,
      blockId,
      timestamp: Date.now(),
    }));

    // Also persist via API
    const { api } = await import('@/lib/api');
    await api.post(`/pages/${pageId}/comments`, {
      content,
      block_id: blockId,
    });
  }, [state.canComment, pageId, toast]);

  return {
    ...state,
    doc: sessionRef.current?.doc,
    // Return from state (not ref) so consumers re-render when provider becomes available
    provider: providerState,
    role: sessionRef.current?.role,
    addComment,
  };
}

/**
 * Hook for managing comments on a page
 */
export function usePageComments(pageId: string | undefined) {
  const queryClient = useQueryClient();

  const comments = useQuery({
    queryKey: ['comments', pageId],
    queryFn: async () => {
      if (!pageId) return [];
      const { api } = await import('@/lib/api');
      const { data } = await api.get(`/pages/${pageId}/comments`);
      return data;
    },
    enabled: !!pageId,
  });

  const createComment = useMutation({
    mutationFn: async (payload: { content: unknown; blockId?: string; parentId?: string }) => {
      if (!pageId) throw new Error('No page ID');
      const { api } = await import('@/lib/api');
      const { data } = await api.post(`/pages/${pageId}/comments`, {
        content: payload.content,
        block_id: payload.blockId,
        parent_id: payload.parentId,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', pageId] });
    },
  });

  const resolveComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { api } = await import('@/lib/api');
      const { data } = await api.post(`/comments/${commentId}/resolve`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', pageId] });
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { api } = await import('@/lib/api');
      await api.delete(`/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', pageId] });
    },
  });

  return {
    comments: comments.data || [],
    isLoading: comments.isLoading,
    createComment,
    resolveComment,
    deleteComment,
  };
}

/**
 * Hook for collaboration activity log
 */
export function usePageActivity(pageId: string | undefined, limit: number = 50) {
  return useQuery({
    queryKey: ['activity', pageId, limit],
    queryFn: async () => {
      if (!pageId) return [];
      const { api } = await import('@/lib/api');
      const { data } = await api.get(`/pages/${pageId}/activity?limit=${limit}`);
      return data;
    },
    enabled: !!pageId,
  });
}
