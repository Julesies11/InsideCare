import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/auth/context/auth-context';
import { handleError } from '@/errors/error-handler';
import {
  emptyStaffPendingChanges,
  StaffPendingChanges,
} from '@/models/staff-pending-changes';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/partials/common/toolbar';
import { format } from 'date-fns';
import {
  Archive,
  ArrowLeft,
  CheckCircle,
  HelpCircle,
  LogOut,
  Mail,
  MoreHorizontal,
  ShieldX,
  UserCheck,
} from 'lucide-react';
import { useParams } from 'react-router';
import { toast } from 'sonner';
import { useAdminAuthStatus } from '@/hooks/use-auth-status';
import {
  useInviteStaff,
  useRevokeInvite,
  useStaffMember,
  useUpdateStaff,
} from '@/hooks/use-staff';
import { useDirtyTracker } from '@/hooks/useDirtyTracker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Container } from '@/components/common/container';
import { StaffActivationDialog } from './components/staff-activation-dialog';
import { StaffDeactivationDialog } from './components/staff-deactivation-dialog';
import { StaffDetailContent } from './staff-detail-content.tsx';

export function StaffDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAdmin, user } = useAuth();
  const { data: staffMember } = useStaffMember(id);
  const { mutateAsync: updateStaff } = useUpdateStaff();
  const { mutateAsync: inviteStaff } = useInviteStaff();
  const { mutateAsync: revokeInvite } = useRevokeInvite();
  const { data: authStatusData } = useAdminAuthStatus();
  const [formData, setFormData] = useState<Record<string, any> | null>(null);
  const [originalData, setOriginalData] = useState<Record<string, any> | null>(
    null,
  );
  const [pendingChanges, setPendingChanges] = useState<StaffPendingChanges>(
    emptyStaffPendingChanges,
  );
  const [saving, setSaving] = useState(false);
  const [photoDirty, setPhotoDirty] = useState(false);
  const saveHandlerRef = useRef<(() => Promise<void>) | null>(null);
  const [inviting, setInviting] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [showActivateDialog, setShowActivateDialog] = useState(false);

  const staffAuthUserId = staffMember?.auth_user_id;

  const handleStatusToggle = async () => {
    if (!id || !staffMember) return;

    const isActivating =
      staffMember.status === 'inactive' || staffMember.status === 'draft';

    if (isActivating) {
      setShowActivateDialog(true);
    } else {
      setShowDeactivateDialog(true);
    }
  };

  const executeActivate = async (sendInvite: boolean) => {
    if (!id || !staffMember) return;

    setArchiving(true);
    try {
      // 1. Perform Activation
      await updateStaff({ id, updates: { status: 'active' } });

      // 2. Perform Invitation if requested
      let inviteMsg = '';
      if (sendInvite && formData?.email && !staffAuthUserId) {
        await inviteStaff({ staffId: id, email: formData.email });
        inviteMsg = ' and portal invitation sent';
      }

      toast.success(`Staff member activated successfully${inviteMsg}`);
    } catch (err) {
      handleError(err as Error, {
        category: 'network',
        title: 'Activation Failed',
      });
    } finally {
      setArchiving(false);
    }
  };

  const executeDeactivate = async (revokeAccess: boolean) => {
    if (!id || !staffMember) return;

    setArchiving(true);
    try {
      // 1. Update status to inactive
      await updateStaff({ id, updates: { status: 'inactive' } });

      // 2. Revoke access if requested
      if (revokeAccess && staffAuthUserId) {
        await revokeInvite({ staffId: id, authUserId: staffAuthUserId });
      }

      toast.success(
        revokeAccess
          ? 'Staff member deactivated and portal access revoked'
          : 'Staff member deactivated successfully',
      );
    } catch (err) {
      handleError(err as Error, {
        category: 'network',
        title: 'Deactivation Failed',
      });
    } finally {
      setArchiving(false);
    }
  };

  const handleInvite = async () => {
    if (!id || !formData?.email) {
      toast.error('Staff email is required to send an invite');
      return;
    }
    setInviting(true);
    try {
      await inviteStaff({ staffId: id, email: formData.email });
      toast.success(
        'Invite sent! The staff member will receive an email to set their password.',
      );
    } catch (err) {
      const error = err as Error;
      handleError(error, { category: 'network', title: 'Invite Failed' });
    } finally {
      setInviting(false);
    }
  };

  const handleRevokeInvite = async () => {
    if (!id || !staffAuthUserId) return;

    const confirmed = window.confirm(
      "Are you sure you want to cancel this invitation? This will delete the user's login account and they will no longer be able to access the portal.",
    );

    if (!confirmed) return;

    setRevoking(true);
    try {
      await revokeInvite({ staffId: id, authUserId: staffAuthUserId });
      toast.success('Invitation cancelled successfully.');
    } catch (err) {
      const error = err as Error;
      handleError(error, { category: 'network', title: 'Revoke Failed' });
    } finally {
      setRevoking(false);
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
      const confirmLeave = window.confirm(
        'You have unsaved changes. Are you sure you want to leave?',
      );
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
                  <div className="flex items-center gap-2.5">
                    <ToolbarPageTitle text="Staff Details" />
                    {id && (
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant={staffAuthUserId ? 'success' : 'destructive'}
                          appearance="light"
                          size="sm"
                          className="font-semibold uppercase tracking-wider text-[10px]"
                        >
                          {staffAuthUserId
                            ? 'Portal Active'
                            : 'No Portal Access'}
                        </Badge>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="size-3.5 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                            </TooltipTrigger>
                            <TooltipContent
                              variant="light"
                              className="max-w-[280px] p-3 shadow-lg border-border"
                            >
                              <p className="font-semibold mb-1">
                                About Portal Access
                              </p>
                              <div className="text-[11px] leading-relaxed text-muted-foreground flex flex-col gap-1.5">
                                {staffAuthUserId &&
                                authStatusData?.[staffAuthUserId] ? (
                                  <>
                                    {authStatusData[staffAuthUserId]
                                      .invited_at && (
                                      <p>
                                        <span className="font-medium text-foreground">
                                          Invited:
                                        </span>{' '}
                                        {format(
                                          new Date(
                                            authStatusData[staffAuthUserId]
                                              .invited_at,
                                          ),
                                          'PPP p',
                                        )}
                                      </p>
                                    )}
                                    {authStatusData[staffAuthUserId]
                                      .confirmed_at && (
                                      <p>
                                        <span className="font-medium text-foreground">
                                          Accepted:
                                        </span>{' '}
                                        {format(
                                          new Date(
                                            authStatusData[staffAuthUserId]
                                              .confirmed_at,
                                          ),
                                          'PPP p',
                                        )}
                                      </p>
                                    )}
                                    {authStatusData[staffAuthUserId]
                                      .last_sign_in_at ? (
                                      <p>
                                        <span className="font-medium text-foreground">
                                          Last Login:
                                        </span>{' '}
                                        {format(
                                          new Date(
                                            authStatusData[staffAuthUserId]
                                              .last_sign_in_at,
                                          ),
                                          'PPP p',
                                        )}
                                      </p>
                                    ) : (
                                      <p className="text-warning">
                                        Never logged in
                                      </p>
                                    )}
                                  </>
                                ) : (
                                  <p>
                                    {staffAuthUserId
                                      ? 'This staff member has an active login and can access the portal to view their roster, timesheets, and participant data.'
                                      : "This staff member currently has no login credentials. They cannot access the portal until you send them an invitation via the 'More Actions' menu."}
                                  </p>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </ToolbarHeading>
            <ToolbarActions>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleSave}
                  disabled={!isDirty || saving}
                  size="sm"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>

                {isAdmin && staffMember && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStatusToggle}
                    disabled={archiving}
                    className={
                      staffMember.status === 'active'
                        ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50'
                        : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                    }
                  >
                    {staffMember.status === 'active' ? (
                      <>
                        <Archive className="size-4 me-1.5" />
                        {archiving ? 'Deactivating...' : 'Deactivate'}
                      </>
                    ) : (
                      <>
                        <UserCheck className="size-4 me-1.5" />
                        {archiving ? 'Activating...' : 'Activate Staff'}
                      </>
                    )}
                  </Button>
                )}

                {isAdmin && staffMember && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="size-9 px-0"
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel className="text-xs font-semibold uppercase text-muted-foreground">
                        Portal Settings
                      </DropdownMenuLabel>
                      {staffAuthUserId ? (
                        <>
                          <div className="px-2 py-1.5 flex flex-col gap-0.5">
                            <div className="flex items-center gap-2 text-[11px] text-green-600 font-bold uppercase tracking-wider">
                              <CheckCircle className="size-3" /> Access Active
                            </div>
                            {authStatusData?.[staffAuthUserId]
                              ?.last_sign_in_at && (
                              <div className="text-[10px] text-muted-foreground ps-5">
                                Last login:{' '}
                                {format(
                                  new Date(
                                    authStatusData[staffAuthUserId]
                                      .last_sign_in_at!,
                                  ),
                                  'PP p',
                                )}
                              </div>
                            )}
                          </div>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={handleInvite}
                            disabled={inviting}
                          >
                            <Mail className="size-4 mr-2" />
                            {inviting ? 'Sending...' : 'Resend Invite'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={handleRevokeInvite}
                            disabled={revoking}
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                          >
                            <ShieldX className="size-4 mr-2" />
                            Revoke Access
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <DropdownMenuItem
                          onClick={handleInvite}
                          disabled={inviting || !formData?.email}
                        >
                          <Mail className="size-4 mr-2" />
                          {inviting ? 'Sending...' : 'Invite to Portal'}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
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

      {staffMember && (
        <StaffDeactivationDialog
          open={showDeactivateDialog}
          onOpenChange={setShowDeactivateDialog}
          staffName={staffMember.staff_name}
          hasPortalAccess={!!staffAuthUserId}
          onConfirmDeactivate={executeDeactivate}
        />
      )}

      {staffMember && (
        <StaffActivationDialog
          open={showActivateDialog}
          onOpenChange={setShowActivateDialog}
          staffName={staffMember.staff_name}
          email={!staffAuthUserId ? formData?.email : undefined}
          onConfirmActivate={executeActivate}
        />
      )}
    </Fragment>
  );
}
