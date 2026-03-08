/**
 * API functions for page sharing and permissions.
 */
import { api } from '@/lib/api';

export interface PermissionResponse {
  id: string;
  page_id: string;
  user_id: string | null;
  role: string;
  granted_by: string | null;
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
  expires_at: string | null;
  created_at: string;
}

export interface SharedPageResponse {
  id: string;
  title: string;
  icon: string | null;
  cover_url: string | null;
  content: any;
  role: string;
  created_at: string;
  updated_at: string;
}

// ── Sharing ──

export async function sharePageWithUser(
  pageId: string,
  email: string,
  role: string = 'viewer'
): Promise<PermissionResponse> {
  const { data } = await api.post(`/pages/${pageId}/share`, { email, role });
  return data;
}

export async function listPermissions(pageId: string): Promise<PermissionResponse[]> {
  const { data } = await api.get(`/pages/${pageId}/permissions`);
  return data;
}

export async function removePermission(pageId: string, userId: string): Promise<void> {
  await api.delete(`/pages/${pageId}/permissions/${userId}`);
}

// ── Share Links ──

export async function createShareLink(
  pageId: string,
  role: string = 'viewer'
): Promise<ShareLinkResponse> {
  const { data } = await api.post(`/pages/${pageId}/share-link`, { role });
  return data;
}

export async function getSharedPage(token: string): Promise<SharedPageResponse> {
  const { data } = await api.get(`/shared/${token}`);
  return data;
}
