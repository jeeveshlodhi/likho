/**
 * Hook to fetch pages shared with the current user.
 */
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';

export interface SharedWithMeItem {
  page_id: string;
  page_title: string;
  page_icon: string | null;
  page_type: string;
  role: string;
  granted_by_name: string | null;
  granted_by_email: string | null;
  granted_at: string;
  expires_at: string | null;
}

export function useSharedWithMe() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isGuest = useAuthStore((s) => s.isGuest);

  return useQuery({
    queryKey: ['shared-with-me'],
    queryFn: async (): Promise<SharedWithMeItem[]> => {
      const { data } = await api.get('/shared-with-me');
      return data;
    },
    enabled: isAuthenticated && !isGuest,
    staleTime: 60 * 1000, // 1 min
  });
}
