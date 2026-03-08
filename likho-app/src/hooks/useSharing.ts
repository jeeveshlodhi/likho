/**
 * React Query hooks for sharing and permissions.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  sharePageWithUser,
  listPermissions,
  removePermission,
  createShareLink,
  getSharedPage,
} from '@/lib/sharingApi';

export function useSharePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pageId, email, role }: { pageId: string; email: string; role: string }) =>
      sharePageWithUser(pageId, email, role),
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
  return useMutation({
    mutationFn: ({ pageId, role }: { pageId: string; role: string }) =>
      createShareLink(pageId, role),
  });
}

export function useSharedPage(token: string | undefined) {
  return useQuery({
    queryKey: ['shared-page', token],
    queryFn: () => getSharedPage(token!),
    enabled: !!token,
  });
}
