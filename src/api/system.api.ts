import { Database } from '@/models/database.types';
import { TABLES } from '@/config/db-tables';
import { ROLE_VIEWS, SYSTEM_VIEWS } from '@/config/query-views';
import { supabase } from '@/lib/supabase';

/**
 * Data Access Layer (DAL) for System-wide Entities.
 *
 * Handles Notifications, RBAC Permissions, and System Settings.
 */
export const systemApi = {
  /**
   * Notifications
   */
  notifications: {
    async list(userId: string, limit = 50, offset = 0, filterRead?: boolean) {
      let query = supabase
        .from(TABLES.NOTIFICATIONS)
        .select('id, type, title, body, link, metadata, is_read, created_at', {
          count: 'exact',
        })
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (filterRead !== undefined) {
        query = query.eq('is_read', filterRead);
      }

      const { data, count, error } = await query.range(
        offset,
        offset + limit - 1,
      );
      if (error) throw error;
      return { data, count };
    },

    async markAsRead(id: string) {
      const { error } = await supabase
        .from(TABLES.NOTIFICATIONS)
        .update({ is_read: true })
        .eq('id', id);
      if (error) throw error;
      return true;
    },

    async markAsUnread(id: string) {
      const { error } = await supabase
        .from(TABLES.NOTIFICATIONS)
        .update({ is_read: false })
        .eq('id', id);
      if (error) throw error;
      return true;
    },

    async markAllAsRead(userId: string) {
      const { error } = await supabase
        .from(TABLES.NOTIFICATIONS)
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      if (error) throw error;
      return true;
    },

    async clearAll(userId: string) {
      const { error } = await supabase
        .from(TABLES.NOTIFICATIONS)
        .delete()
        .eq('user_id', userId);
      if (error) throw error;
      return true;
    },

    async clear(id: string) {
      const { error } = await supabase
        .from(TABLES.NOTIFICATIONS)
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    },

    async getUnreadCount(userId: string) {
      const { count, error } = await supabase
        .from(TABLES.NOTIFICATIONS)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    },

    /**
     * Subscribes to real-time notification inserts for a user.
     */
    subscribe(userId: string, onInsert: (payload: any) => void) {
      const channelName = `ic_notifications_${userId}_${Math.random().toString(36).substring(7)}`;
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: TABLES.NOTIFICATIONS,
            filter: `user_id=eq.${userId}`,
          },
          (payload) => onInsert(payload),
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    },
  },

  /**
   * Authentication & Security Edge Functions
   */
  auth: {
    /**
     * Fetches Supabase Auth status for all users via Edge Function.
     * Strictly for Admin use.
     */
    async getAdminStatus() {
      const { data, error } = await supabase.functions.invoke(
        'ic-admin-auth-status',
      );
      if (error) throw error;
      return data;
    },

    /**
     * Updates the current user's password.
     */
    async updatePassword(password: string) {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      return true;
    },
  },

  /**
   * Roles & RBAC
   */
  roles: {
    async list() {
      const { data, error } = await supabase
        .from(TABLES.ROLES)
        .select(ROLE_VIEWS.LIST)
        .order('role_name', { ascending: true });

      if (error) throw error;

      return (data || []).map((role) => ({
        ...role,
        assigned_count: (role as any).staff?.length || 0,
      }));
    },

    async create(roleData: Database['public']['Tables']['ic_roles']['Insert']) {
      const { data, error } = await supabase
        .from(TABLES.ROLES)
        .insert([roleData])
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data)
        throw new Error('You do not have permission to perform this action');
      return data;
    },

    async update(
      id: string,
      updates: Database['public']['Tables']['ic_roles']['Update'],
    ) {
      const { data, error } = await supabase
        .from(TABLES.ROLES)
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data)
        throw new Error('You do not have permission to perform this action');
      return data;
    },

    async delete(id: string) {
      const { error } = await supabase.from(TABLES.ROLES).delete().eq('id', id);

      if (error) throw error;
      return true;
    },
  },

  /**
   * RBAC Permissions
   */
  permissions: {
    async listAll() {
      const { data, error } = await supabase
        .from(TABLES.ROLE_PERMISSIONS)
        .select('*');

      if (error) throw error;
      return data || [];
    },

    async listByRole(roleId: string) {
      const { data, error } = await supabase
        .from(TABLES.ROLE_PERMISSIONS)
        .select(SYSTEM_VIEWS.PERMISSIONS)
        .eq('role_id', roleId);

      if (error) throw error;
      return data || [];
    },

    async updatePermission(
      id: string,
      accessLevel: Database['public']['Enums']['ic_access_level_enum'],
    ) {
      const { data, error } = await supabase
        .from(TABLES.ROLE_PERMISSIONS)
        .update({ access_level: accessLevel })
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },

    async upsert(role_id: string, updates: any) {
      const { data, error } = await supabase
        .from(TABLES.ROLE_PERMISSIONS)
        .upsert({ role_id, ...updates }, { onConflict: 'role_id' })
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data)
        throw new Error('You do not have permission to perform this action');
      return data;
    },

    /**
     * Staff Document Role Overrides
     */
    async listStaffDocumentPermissions(documentId: string) {
      const { data, error } = await supabase
        .from(TABLES.STAFF_DOCUMENT_ROLES)
        .select(
          `
          id,
          document_id,
          role_id,
          access_level,
          role:${TABLES.ROLES}(id, role_name)
        `,
        )
        .eq('document_id', documentId);

      if (error) throw error;
      return data || [];
    },

    async listMultipleStaffDocumentPermissions(documentIds: string[]) {
      if (!documentIds || documentIds.length === 0) return [];
      const { data, error } = await supabase
        .from(TABLES.STAFF_DOCUMENT_ROLES)
        .select(
          `
          id,
          document_id,
          role_id,
          access_level,
          role:${TABLES.ROLES}(id, role_name)
        `,
        )
        .in('document_id', documentIds);

      if (error) throw error;
      return data || [];
    },

    async updateStaffDocumentPermissions(
      documentId: string,
      roles: Array<{ role_id: string; access_level: string }>,
    ) {
      await supabase
        .from(TABLES.STAFF_DOCUMENT_ROLES)
        .delete()
        .eq('document_id', documentId);
      if (roles.length > 0) {
        const { error } = await supabase
          .from(TABLES.STAFF_DOCUMENT_ROLES)
          .insert(
            roles.map((r) => ({
              document_id: documentId,
              role_id: r.role_id,
              access_level: r.access_level as any,
            })),
          );
        if (error) throw error;
      }
      return true;
    },
  },

  /**
   * Report Preferences
   */
  reportPreferences: {
    async get(staffId: string, reportType: string) {
      const { data, error } = await supabase
        .from(TABLES.REPORT_PREFERENCES)
        .select('criteria')
        .eq('staff_id', staffId)
        .eq('report_type', reportType)
        .maybeSingle();

      if (error) throw error;
      return data?.criteria || null;
    },

    async save(staffId: string, reportType: string, criteria: any) {
      const { data, error } = await supabase
        .from(TABLES.REPORT_PREFERENCES)
        .upsert(
          {
            staff_id: staffId,
            report_type: reportType,
            criteria,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'staff_id,report_type' },
        )
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  },
};
