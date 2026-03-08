/**
 * API functions for workspace, spaces, and pages (online notes).
 */
import { api } from '@/lib/api';

// ── Types ──

export interface WorkspaceResponse {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  type: string;
  owner_id: string;
  created_at: string;
}

export interface SpaceResponse {
  id: string;
  workspace_id: string;
  name: string;
  icon: string | null;
  type: 'online' | 'offline';
  is_default: boolean;
  sort_order: number;
  created_at: string;
}

export interface PageResponse {
  id: string;
  workspace_id: string;
  space_id: string | null;
  parent_id: string | null;
  created_by: string | null;
  last_edited_by: string | null;
  title: string;
  icon: string | null;
  cover_url: string | null;
  is_folder: boolean;
  sort_order: number;
  version: number;
  created_at: string;
  updated_at: string;
  content?: any;
}

export interface PageCreateData {
  title?: string;
  space_id: string;
  parent_id?: string | null;
  is_folder?: boolean;
  icon?: string | null;
  content?: any;
}

export interface PageUpdateData {
  title?: string;
  icon?: string | null;
  cover_url?: string | null;
  content?: any;
}

// ── Workspace ──

export async function fetchMyWorkspace(): Promise<WorkspaceResponse> {
  const { data } = await api.get('/workspaces/me');
  return data;
}

export async function fetchSpaces(workspaceId: string): Promise<SpaceResponse[]> {
  const { data } = await api.get(`/workspaces/${workspaceId}/spaces`);
  return data;
}

// ── Pages ──

export async function createPage(pageData: PageCreateData): Promise<PageResponse> {
  const { data } = await api.post('/pages', pageData);
  return data;
}

export async function fetchPages(spaceId: string, parentId?: string | null): Promise<PageResponse[]> {
  const params: Record<string, string> = { space_id: spaceId, all: 'true' };
  if (parentId) params.parent_id = parentId;
  const { data } = await api.get('/pages', { params });
  return data;
}

export async function fetchPage(pageId: string): Promise<PageResponse> {
  const { data } = await api.get(`/pages/${pageId}`);
  return data;
}

export async function updatePage(pageId: string, updates: PageUpdateData): Promise<PageResponse> {
  const { data } = await api.patch(`/pages/${pageId}`, updates);
  return data;
}

export async function deletePage(pageId: string): Promise<void> {
  await api.delete(`/pages/${pageId}`);
}

export async function movePage(pageId: string, parentId: string | null, spaceId?: string | null): Promise<PageResponse> {
  const { data } = await api.patch(`/pages/${pageId}/move`, { parent_id: parentId, space_id: spaceId });
  return data;
}
