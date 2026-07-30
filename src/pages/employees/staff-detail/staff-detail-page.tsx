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
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/partials/common/toolbar';
import { format } from 'date-fns';
import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  CheckCircle,
  Clock,
  Copy,
  HelpCircle,
  Key,
  Link as LinkIcon,
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
import {
  getInviteTimeRemaining,
  getStaffPortalState,
} from '@/utils/invite-utils';
import { Alert } from '@/components/ui/alert';
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

  // Derive portal confirmation state early so handlers capture the correct value
  const authUserStatus = staffAuthUserId ? authStatusData?.[staffAuthUserId] : null;
  const isPortalConfirmed = !!(authUserStatus?.confirmed_at || authUserStatus?.last_sign_in_at);

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
      // 1. Save staff record first if save handler exists
      if (saveHandlerRef.current) {
        await saveHandlerRef.current();
      }

      // 2. Perform Activation
      await updateStaff({ id, updates: { status: 'active' } });

      // 3. Perform Invitation if requested
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
      // 1. Save staff record & pending changes first if save handler exists
      if (saveHandlerRef.current) {
        await saveHandlerRef.current();
      }

      // 2. Update status to inactive
      await updateStaff({ id, updates: { status: 'inactive' } });

      // 3. Revoke access if requested
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

  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);

  const handleInvite = async () => {
    if (!id || !formData?.email) {
      toast.error('Staff email is required to send an invite');
      return;
    }
    setInviting(true);
    try {
      // Save staff record first if save handler exists
      if (saveHandlerRef.current) {
        await saveHandlerRef.current();
      }
      const res = await inviteStaff({ staffId: id, email: formData.email });
      if (res?.confirmUrl) {
        setLastInviteUrl(res.confirmUrl);
      }
      toast.success(
        isPortalConfirmed
          ? 'Password reset email sent! The staff member will receive a link to reset their password.'
          : 'Invite sent! The staff member will receive an email to set their password.',
      );
    } catch (err) {
      const error = err as Error;
      handleError(error, { category: 'network', title: 'Invite Failed' });
    } finally {
      setInviting(false);
    }
  };

  const handleCopyInviteUrl = async () => {
    if (!lastInviteUrl) return;
    try {
      await navigator.clipboard.writeText(lastInviteUrl);
      toast.success('Invite link copied to clipboard!');
    } catch (_) {
      toast.error('Failed to copy invite link');
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

  const portalState = getStaffPortalState(staffAuthUserId, authUserStatus);

  const portalBadge = !staffAuthUserId
    ? { label: 'No Portal Access', variant: 'destructive' as const }
    : portalState === 'active'
      ? { label: 'Portal Active', variant: 'success' as const }
      : portalState === 'invite_expired'
        ? { label: 'Invite Expired', variant: 'destructive' as const }
        : {
            label: `Invite Pending ${getInviteTimeRemaining(authUserStatus?.invited_at) ? `(${getInviteTimeRemaining(authUserStatus?.invited_at)})` : ''}`,
            variant: 'warning' as const,
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
                          variant={portalBadge.variant}
                          appearance="light"
                          size="sm"
                          className="font-semibold uppercase tracking-wider text-[10px]"
                        >
                          {portalBadge.label}
                        </Badge>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="size-3.5 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                            </TooltipTrigger>
                            <TooltipContent
                              side="bottom"
                              align="start"
                              sideOffset={8}
                              variant="light"
                              className="max-w-[280px] p-3 shadow-lg border-border z-[100]"
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
                            {isPortalConfirmed ? (
                              <div className="flex items-center gap-2 text-[11px] text-green-600 font-bold uppercase tracking-wider">
                                <CheckCircle className="size-3" /> Access Active
                              </div>
                            ) : portalState === 'invite_expired' ? (
                              <div className="flex items-center gap-2 text-[11px] text-red-600 dark:text-red-400 font-bold uppercase tracking-wider">
                                <AlertTriangle className="size-3" /> Invite Expired
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-[11px] text-amber-600 font-bold uppercase tracking-wider">
                                <Clock className="size-3" /> Invite Pending
                              </div>
                            )}
                            {authUserStatus?.last_sign_in_at && (
                              <div className="text-[10px] text-muted-foreground ps-5">
                                Last login:{' '}
                                {format(
                                  new Date(authUserStatus.last_sign_in_at),
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
                            {isPortalConfirmed ? (
                              <>
                                <Key className="size-4 mr-2" />
                                {inviting ? 'Sending Reset...' : 'Send Password Reset'}
                              </>
                            ) : (
                              <>
                                <Mail className="size-4 mr-2" />
                                {inviting ? 'Sending Invite...' : 'Resend Invite'}
                              </>
                            )}
                          </DropdownMenuItem>
                          {lastInviteUrl && (
                            <DropdownMenuItem onClick={handleCopyInviteUrl}>
                              <Copy className="size-4 mr-2" />
                              Copy Invite Link
                            </DropdownMenuItem>
                          )}
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
        {portalState === 'invite_expired' && (
          <Alert
            variant="warning"
            className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-900 dark:text-amber-200 text-sm">
                  Portal Invitation Expired
                </h4>
                <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                  The invitation link sent to{' '}
                  <span className="font-medium">
                    {formData?.email || staffMember?.email}
                  </span>{' '}
                  on{' '}
                  {authUserStatus?.invited_at
                    ? format(new Date(authUserStatus.invited_at), 'PPP p')
                    : 'a previous date'}{' '}
                  has expired (24-hour limit).
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" onClick={handleInvite} disabled={inviting}>
                <Mail className="size-4 me-1.5" />
                {inviting ? 'Resending...' : 'Resend Invitation'}
              </Button>
              {lastInviteUrl && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyInviteUrl}
                >
                  <Copy className="size-4 me-1.5" />
                  Copy Invite Link
                </Button>
              )}
            </div>
          </Alert>
        )}
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
