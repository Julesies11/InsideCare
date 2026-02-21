import { Fragment, useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '@/auth/context/auth-context';
import { Container } from '@/components/common/container';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { StaffDetailContent } from './staff-detail-content.tsx';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/partials/common/toolbar';
import { useSettings } from '@/providers/settings-provider';
import { StaffPendingChanges, emptyStaffPendingChanges } from '@/models/staff-pending-changes';
import { useDirtyTracker } from '@/hooks/useDirtyTracker';
import { useStaff } from '@/hooks/useStaff';

export function StaffDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { settings } = useSettings();
  const { user } = useAuth();
  const { updateStaff } = useStaff();
  const [formData, setFormData] = useState<any>(null);
  const [originalData, setOriginalData] = useState<any>(null);
  const [pendingChanges, setPendingChanges] = useState<StaffPendingChanges>(emptyStaffPendingChanges);
  const [saving, setSaving] = useState(false);
  const [photoDirty, setPhotoDirty] = useState(false);
  const saveHandlerRef = useRef<(() => Promise<void>) | null>(null);
  const [staffAuthUserId, setStaffAuthUserId] = useState<string | null | undefined>(undefined);
  const [inviting, setInviting] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('staff')
      .select('auth_user_id, email, name, created_at')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => {
        setStaffAuthUserId(data?.auth_user_id ?? null);
        // A record is "new" if it has no name yet (just created as a blank draft)
        setIsNewRecord(!data?.name);
      });
  }, [id]);

  const handleInvite = async () => {
    if (!id || !formData?.email) {
      toast.error('Staff email is required to send an invite');
      return;
    }
    setInviting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-staff-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ staffId: id, email: formData.email }),
        },
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Invite failed');
      setStaffAuthUserId(result.authUserId);
      toast.success('Invite sent! The staff member will receive an email to set their password.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send invite');
    } finally {
      setInviting(false);
    }
  };

  // Use centralized dirty tracking with json-diff-ts
  const { isDirty: formIsDirty } = useDirtyTracker({
    formData: formData || {},
    originalData: originalData || {},
    pendingChanges,
  });
  const isDirty = formIsDirty || photoDirty;

  // Warn user before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleBack = useCallback(() => {
    if (isDirty) {
      const confirmLeave = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmLeave) return;
    }
    // Use browser back to preserve URL state from previous page
    window.history.back();
  }, [isDirty]);

  const handleSave = async () => {
    if (saveHandlerRef.current) {
      await saveHandlerRef.current();
    }
  };

  return (
    <Fragment>
      <div className="sticky top-0 z-20 bg-background border-b border-border">
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={handleBack}>
                  <ArrowLeft className="size-4 me-1.5" />
                  Back
                </Button>
                <div>
                  <ToolbarPageTitle text="Staff Details" />
                  <ToolbarDescription>
                    View and manage staff member information
                  </ToolbarDescription>
                </div>
              </div>
            </ToolbarHeading>
            <ToolbarActions>
              {staffAuthUserId === null && (
                <Button
                  variant="outline"
                  onClick={handleInvite}
                  disabled={inviting}
                >
                  <Mail className="size-4 me-1.5" />
                  {inviting ? 'Sending...' : 'Invite to Portal'}
                </Button>
              )}
              {staffAuthUserId && (
                <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                  <CheckCircle className="size-4" /> Portal Access Active
                </span>
              )}
              <Button
                onClick={handleSave}
                disabled={(!isDirty && !isNewRecord && !photoDirty) || saving}
                variant={(isDirty || isNewRecord || photoDirty) ? 'primary' : 'secondary'}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </ToolbarActions>
          </Toolbar>
        </Container>
      </div>
      <Container>
        <StaffDetailContent
          staffId={id}
          onFormDataChange={setFormData}
          onOriginalDataChange={setOriginalData}
          onSavingChange={setSaving}
          saveHandlerRef={saveHandlerRef}
          pendingChanges={pendingChanges}
          onPendingChangesChange={setPendingChanges}
          updateStaff={updateStaff}
          onSaveSuccess={() => {
            setPendingChanges(emptyStaffPendingChanges);
            setIsNewRecord(false);
          }}
          onPhotoDirtyChange={setPhotoDirty}
        />
      </Container>
    </Fragment>
  );
}
