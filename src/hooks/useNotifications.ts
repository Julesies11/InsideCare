import { useCallback, useEffect, useState } from 'react';
import { systemApi } from '@/api/system.api';
import { useAuth } from '@/auth/context/auth-context';
import { toast } from 'sonner';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  metadata: Record<string, any> | null;
  is_read: boolean;
  created_at: string;
}

export function useNotifications() {
  const { auth, user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const fetchNotifications = useCallback(
    async (limit = 50, offset = 0, filterRead?: boolean) => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, count } = await systemApi.notifications.list(
          user.id,
          limit,
          offset,
          filterRead,
        );
        setNotifications((data as AppNotification[]) || []);
        if (count !== null) setTotalCount(count);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    },
    [user?.id],
  );

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    if (!auth?.access_token) return;

    // Initial fetch for the topbar (latest 50)
    fetchNotifications(50, 0);

    // Subscribe to real-time inserts via DAL
    const unsubscribe = systemApi.notifications.subscribe(
      user.id,
      (payload) => {
        const newNotification = payload.new as AppNotification;

        setNotifications((prev) => [newNotification, ...prev]);
        setTotalCount((prev) => prev - 1);

        toast.info(newNotification.title, {
          description: newNotification.body,
          duration: 5000,
        });
      },
    );

    return () => {
      unsubscribe();
    };
  }, [auth?.access_token, user?.id, fetchNotifications]);

  const markAllRead = useCallback(async () => {
    if (!user?.id) return;
    await systemApi.notifications.markAllAsRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }, [user?.id]);

  const markRead = useCallback(async (id: string) => {
    await systemApi.notifications.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
  }, []);

  const markUnread = useCallback(async (id: string) => {
    await systemApi.notifications.markAsUnread(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: false } : n)),
    );
  }, []);

  const clearAll = useCallback(async () => {
    if (!user?.id) return;
    await systemApi.notifications.clearAll(user.id);
    setNotifications([]);
    setTotalCount(0);
    toast.success('All notifications cleared');
  }, [user?.id]);

  const clearNotification = useCallback(async (id: string) => {
    await systemApi.notifications.clear(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setTotalCount((prev) => prev - 1);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return {
    notifications,
    loading,
    unreadCount,
    totalCount,
    markAllRead,
    markRead,
    markUnread,
    clearAll,
    clearNotification,
    refetch: fetchNotifications,
  };
}
