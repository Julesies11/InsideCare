import { AuthUserStatus } from '@/hooks/use-auth-status';
import { format } from 'date-fns';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Copy,
  Key,
  Mail,
  ShieldCheck,
  ShieldX,
  UserX,
} from 'lucide-react';
import {
  getInviteTimeRemaining,
  getStaffPortalState,
} from '@/utils/invite-utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface StaffPortalAccountCardProps {
  staffId: string;
  email: string;
  staffAuthUserId?: string | null;
  authUserStatus?: AuthUserStatus | null;
  staffEmploymentStatus?: string;
  onInvite: () => Promise<void>;
  onCopyInviteUrl?: () => void;
  onRevokeInvite?: () => Promise<void>;
  lastInviteUrl?: string | null;
  inviting?: boolean;
  revoking?: boolean;
  isAdmin?: boolean;
}

export function StaffPortalAccountCard({
  staffId,
  email,
  staffAuthUserId,
  authUserStatus,
  staffEmploymentStatus,
  onInvite,
  onCopyInviteUrl,
  onRevokeInvite,
  lastInviteUrl,
  inviting = false,
  revoking = false,
  isAdmin = false,
}: StaffPortalAccountCardProps) {
  const portalState = getStaffPortalState(staffAuthUserId, authUserStatus);
  const timeRemaining = getInviteTimeRemaining(authUserStatus?.invited_at);
  const isEmploymentActive = !staffEmploymentStatus || staffEmploymentStatus === 'active';

  const statusBadgeMap = {
    no_access: {
      label: 'Login Disabled',
      variant: 'secondary' as const,
      icon: UserX,
    },
    active: {
      label: 'Login Enabled',
      variant: 'success' as const,
      icon: CheckCircle,
    },
    invite_pending: {
      label: `Invite Pending ${timeRemaining ? `(${timeRemaining})` : ''}`,
      variant: 'warning' as const,
      icon: Clock,
    },
    invite_expired: {
      label: 'Invite Expired',
      variant: 'destructive' as const,
      icon: AlertTriangle,
    },
  };

  const statusConfig = statusBadgeMap[portalState];
  const StatusIcon = statusConfig.icon;

  const formatDateSafe = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? null : format(d, 'PP p');
    } catch (_) {
      return null;
    }
  };

  const lastSignInFormatted = formatDateSafe(authUserStatus?.last_sign_in_at);
  const invitedAtFormatted = formatDateSafe(authUserStatus?.invited_at);

  return (
    <Card id="staff_portal_account" className="p-3.5 border-border bg-slate-50/50 dark:bg-slate-900/30">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left Side: Label, Status Badge & Account Info */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <ShieldCheck className="size-4 text-primary shrink-0" />
            <span>Portal Access:</span>
          </div>

          <Badge
            variant={statusConfig.variant}
            appearance="light"
            size="sm"
            className="font-medium text-[11px]"
          >
            <StatusIcon className="size-3 me-1" />
            {statusConfig.label}
          </Badge>

          {email && (
            <span className="text-muted-foreground hidden sm:inline select-all">
              • {email}
            </span>
          )}

          {lastSignInFormatted ? (
            <span className="text-muted-foreground text-[11px] hidden md:inline">
              (Last login: {lastSignInFormatted})
            </span>
          ) : invitedAtFormatted ? (
            <span className="text-muted-foreground text-[11px] hidden md:inline">
              (Invited: {invitedAtFormatted})
            </span>
          ) : null}

          {staffEmploymentStatus === 'draft' && (
            <span className="text-[11px] font-medium text-amber-800 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/60 flex items-center gap-1">
              <AlertTriangle className="size-3 shrink-0" />
              Draft profile — activate employee to send portal invite
            </span>
          )}
        </div>

        {/* Right Side: Inline Action Buttons */}
        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {portalState === 'no_access' && (
              <Button
                size="sm"
                onClick={onInvite}
                disabled={inviting || !email || !isEmploymentActive}
                title={!isEmploymentActive ? 'Activate employee to send portal invite' : undefined}
                className="h-8 px-3 text-xs bg-green-600 hover:bg-green-700 text-white font-medium"
              >
                <Mail className="size-3.5 me-1.5" />
                {inviting ? 'Sending...' : 'Send Portal Invite'}
              </Button>
            )}

            {(portalState === 'invite_pending' || portalState === 'invite_expired') && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onInvite}
                  disabled={inviting || !email || !isEmploymentActive}
                  title={!isEmploymentActive ? 'Activate employee to resend invite' : undefined}
                  className="h-8 px-3 text-xs font-medium text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                >
                  <Mail className="size-3.5 me-1.5" />
                  {inviting ? 'Resending...' : 'Resend Invite'}
                </Button>
                {lastInviteUrl && onCopyInviteUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onCopyInviteUrl}
                    className="h-8 px-3 text-xs"
                  >
                    <Copy className="size-3.5 me-1.5" />
                    Copy Link
                  </Button>
                )}
              </>
            )}

            {portalState === 'active' && (
              <>
                <Button
                  size="sm"
                  onClick={onInvite}
                  disabled={inviting}
                  variant="outline"
                  className="h-8 px-3 text-xs"
                >
                  <Key className="size-3.5 me-1.5" />
                  {inviting ? 'Sending Reset...' : 'Send Password Reset'}
                </Button>
                {lastInviteUrl && onCopyInviteUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onCopyInviteUrl}
                    className="h-8 px-3 text-xs"
                  >
                    <Copy className="size-3.5 me-1.5" />
                    Copy Link
                  </Button>
                )}
              </>
            )}

            {staffAuthUserId && onRevokeInvite && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onRevokeInvite}
                disabled={revoking}
                className="h-8 px-2.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive ms-1"
              >
                <ShieldX className="size-3.5 me-1" />
                {revoking ? 'Disabling...' : 'Disable Web Login'}
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
