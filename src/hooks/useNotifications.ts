import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/context/auth-context';
import { toast } from 'sonner';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export function useNotifications() {
  const { auth, user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const fetchNotifications = useCallback(async (limit = 50, offset = 0, filterRead?: boolean) => {
    if (!user?.id) return;

    setLoading(true);
    let query = supabase
      .from('notifications')
      .select('id, type, title, body, link, is_read, created_at', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (filterRead !== undefined) {
      query = query.eq('is_read', filterRead);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    
    if (error) {
      console.error('Error fetching notifications:', error);
      setLoading(false);
      return;
    }

    setNotifications((data as AppNotification[]) || []);
    if (count !== null) setTotalCount(count);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    if (!auth?.access_token || !user?.id) return;
    
    // Initial fetch for the topbar (latest 50)
    fetchNotifications(50, 0);

    // Subscribe to real-time inserts for this user
    const channel = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as AppNotification;
          
          // Prepend the new notification to the list
          setNotifications((prev) => [newNotification, ...prev]);
          setTotalCount(prev => prev + 1);
          
          // Trigger a global toast alert so the user sees it immediately
          toast.info(newNotification.title, {
            description: newNotification.body,
            duration: 5000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [auth?.access_token, user?.id, fetchNotifications]);

  const markAllRead = useCallback(async () => {
    if (!user?.id) return;

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }, [user?.id]);

  const markRead = useCallback(async (id: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  }, []);

  const markUnread = useCallback(async (id: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: false })
      .eq('id', id);

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: false } : n))
    );
  }, []);

  const clearAll = useCallback(async () => {
    if (!user?.id) return;

    await supabase
      .from('notifications')
      .delete()
      .eq('user_id', user.id);

    setNotifications([]);
    setTotalCount(0);
    toast.success('All notifications cleared');
  }, [user?.id]);

  const clearNotification = useCallback(async (id: string) => {
    await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setTotalCount(prev => prev - 1);
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
    refetch: fetchNotifications 
  };
}
