/**
 * React Query hooks for sharing and permissions.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CollaborationRole } from './useCollaboration';

export interface PermissionResponse {
  id: string;
  page_id: string;
  user_id: string | null;
  role: string;
  granted_by: string | null;
  expires_at: string | null;
  created_at: string;
  user_email: string | null;
  user_name: string | null;
}

export interface ShareLinkResponse {
  id: string;
  page_id: string;
  token: string;
  role: string;
  view_count: number;
  max_views: number | null;
  require_email: boolean;
  allow_comments: boolean;
  allow_export: boolean;
  expires_at: string | null;
  created_at: string;
  revoked_at: string | null;
}

export interface ShareLinkCreate {
  role: CollaborationRole;
  expires_at?: string;
  max_views?: number;
  require_email?: boolean;
  allow_comments?: boolean;
  allow_export?: boolean;
}

// ── API Functions ──

async function sharePageWithUser(
  pageId: string,
  email: string,
  role: string,
  expiresAt?: string
) {
  const { api } = await import('@/lib/api');
  const { data } = await api.post(`/pages/${pageId}/share`, { 
    email, 
    role,
    expires_at: expiresAt 
  });
  return data as PermissionResponse;
}

async function listPermissions(pageId: string): Promise<PermissionResponse[]> {
  const { api } = await import('@/lib/api');
  const { data } = await api.get(`/pages/${pageId}/permissions`);
  return data;
}

async function removePermission(pageId: string, userId: string): Promise<void> {
  const { api } = await import('@/lib/api');
  await api.delete(`/pages/${pageId}/permissions/${userId}`);
}

async function createShareLink(
  pageId: string,
  payload: ShareLinkCreate
): Promise<ShareLinkResponse> {
  const { api } = await import('@/lib/api');
  const { data } = await api.post(`/pages/${pageId}/share-link`, payload);
  return data;
}

async function listShareLinks(pageId: string): Promise<ShareLinkResponse[]> {
  const { api } = await import('@/lib/api');
  const { data } = await api.get(`/pages/${pageId}/share-links`);
  return data;
}

async function revokeShareLink(linkId: string): Promise<void> {
  const { api } = await import('@/lib/api');
  await api.delete(`/share-links/${linkId}`);
}

async function updateShareLink(
  linkId: string,
  updates: Partial<ShareLinkCreate>
): Promise<ShareLinkResponse> {
  const { api } = await import('@/lib/api');
  const { data } = await api.patch(`/share-links/${linkId}`, updates);
  return data;
}

async function getSharedPage(token: string) {
  const { api } = await import('@/lib/api');
  const { data } = await api.get(`/shared/${token}`);
  return data;
}

// ── Hooks ──

export function useSharePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ 
      pageId, 
      email, 
      role,
      expiresAt 
    }: { 
      pageId: string; 
      email: string; 
      role: string;
      expiresAt?: string;
    }) => sharePageWithUser(pageId, email, role, expiresAt),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['permissions', variables.pageId] });
    },
  });
}

export function usePagePermissions(pageId: string | undefined) {
  return useQuery({
    queryKey: ['permissions', pageId],
    queryFn: () => listPermissions(pageId!),
    enabled: !!pageId,
  });
}

export function useRemovePermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pageId, userId }: { pageId: string; userId: string }) =>
      removePermission(pageId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['permissions', variables.pageId] });
    },
  });
}

export function useCreateShareLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pageId, payload }: { pageId: string; payload: ShareLinkCreate }) =>
      createShareLink(pageId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['share-links', variables.pageId] });
    },
  });
}

export function usePageShareLinks(pageId: string | undefined) {
  return useQuery({
    queryKey: ['share-links', pageId],
    queryFn: () => listShareLinks(pageId!),
    enabled: !!pageId,
  });
}

export function useRevokeShareLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ linkId, pageId }: { linkId: string; pageId: string }) =>
      revokeShareLink(linkId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['share-links', variables.pageId] });
    },
  });
}

export function useUpdateShareLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ 
      linkId, 
      pageId, 
      updates 
    }: { 
      linkId: string; 
      pageId: string;
      updates: Partial<ShareLinkCreate>;
    }) => updateShareLink(linkId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['share-links', variables.pageId] });
    },
  });
}

export function useSharedPage(token: string | undefined) {
  return useQuery({
    queryKey: ['shared-page', token],
    queryFn: () => getSharedPage(token!),
    enabled: !!token,
  });
}
