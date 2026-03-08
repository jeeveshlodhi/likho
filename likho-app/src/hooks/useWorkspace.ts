/**
 * React Query hooks for online workspace, spaces, and pages.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchMyWorkspace,
  fetchSpaces,
  fetchPages,
  fetchPage,
  createPage,
  updatePage,
  deletePage,
  movePage,
  type PageCreateData,
  type PageUpdateData,
} from '@/lib/workspaceApi';
import { useAuthStore } from '@/store/authStore';

// ── Workspace ──

export function useWorkspace() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['workspace'],
    queryFn: fetchMyWorkspace,
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000, // 10 min
  });
}

export function useSpaces(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['spaces', workspaceId],
    queryFn: () => fetchSpaces(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000,
  });
}

// ── Pages ──

export function usePages(spaceId: string | undefined) {
  return useQuery({
    queryKey: ['pages', spaceId],
    queryFn: () => fetchPages(spaceId!),
    enabled: !!spaceId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function usePage(pageId: string | undefined) {
  return useQuery({
    queryKey: ['page', pageId],
    queryFn: () => fetchPage(pageId!),
    enabled: !!pageId,
    staleTime: 10 * 1000,
  });
}

export function useCreatePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PageCreateData) => createPage(data),
    onSuccess: (newPage) => {
      queryClient.invalidateQueries({ queryKey: ['pages', newPage.space_id] });
    },
  });
}

export function useUpdatePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pageId, data }: { pageId: string; data: PageUpdateData }) =>
      updatePage(pageId, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['page', updated.id], updated);
      queryClient.invalidateQueries({ queryKey: ['pages', updated.space_id] });
    },
  });
}

export function useDeletePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pageId: string) => deletePage(pageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
    },
  });
}

export function useMovePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      pageId,
      parentId,
      spaceId,
    }: {
      pageId: string;
      parentId: string | null;
      spaceId?: string | null;
    }) => movePage(pageId, parentId, spaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
    },
  });
}
