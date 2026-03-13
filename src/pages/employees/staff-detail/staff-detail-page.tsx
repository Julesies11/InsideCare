import { Fragment, useState, useRef, useCallback, useEffect } from 'react';
import { useParams } from 'react-router';
import { Container } from '@/components/common/container';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { StaffDetailContent } from './staff-detail-content.tsx';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { handleError } from '@/errors/error-handler';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/partials/common/toolbar';
import { StaffPendingChanges, emptyStaffPendingChanges } from '@/models/staff-pending-changes';
import { useDirtyTracker } from '@/hooks/useDirtyTracker';
import { useUpdateStaff, useStaffMember } from '@/hooks/use-staff';

export function StaffDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: staffMember } = useStaffMember(id);
  const { mutateAsync: updateStaff } = useUpdateStaff();
  const [formData, setFormData] = useState<Record<string, any> | null>(null);
  const [originalData, setOriginalData] = useState<Record<string, any> | null>(null);
  const [pendingChanges, setPendingChanges] = useState<StaffPendingChanges>(emptyStaffPendingChanges);
  const [saving, setSaving] = useState(false);
  const [photoDirty, setPhotoDirty] = useState(false);
  const saveHandlerRef = useRef<(() => Promise<void>) | null>(null);
  const [inviting, setInviting] = useState(false);

  const staffAuthUserId = staffMember?.auth_user_id;
  const isNewRecord = !staffAuthUserId;

  const handleInvite = async () => {
    if (!id || !formData?.email) {
      toast.error('Staff email is required to send an invite');
      return;
    }
    setInviting(true);
    try {
      const { error } = await supabase.functions.invoke('invite-staff-user', {
        body: { staffId: id, email: formData.email },
      });
      if (error) throw new Error(error.message || 'Invite failed');
      toast.success('Invite sent! The staff member will receive an email to set their password.');
    } catch (err) {
      const error = err as Error;
      handleError(error, { category: 'network', title: 'Invite Failed' });
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
                  <ToolbarDescription>View and manage staff member information</ToolbarDescription>
                </div>
              </div>
            </ToolbarHeading>
            <ToolbarActions>
              <div className="flex items-center gap-2.5">
                {staffAuthUserId ? (
                  <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                    <CheckCircle className="size-4" /> Portal Access Active
                  </span>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleInvite}
                    disabled={inviting || !formData?.email || isNewRecord}
                  >
                    <Mail className="size-4 me-1.5" />
                    {inviting ? 'Sending...' : 'Invite to Portal'}
                  </Button>
                )}
                <Button onClick={handleSave} disabled={!isDirty || saving} size="sm">
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </ToolbarActions>
          </Toolbar>
        </Container>
      </div>

      <Container className="py-6">
        {id && (
          <StaffDetailContent
            staffId={id}
            onFormDataChange={setFormData}
            onOriginalDataChange={setOriginalData}
            onSavingChange={setSaving}
            saveHandlerRef={saveHandlerRef}
            pendingChanges={pendingChanges}
            onPendingChangesChange={setPendingChanges}
            updateStaff={updateStaff}
            onPhotoDirtyChange={setPhotoDirty}
          />
        )}
      </Container>
    </Fragment>
  );
}
