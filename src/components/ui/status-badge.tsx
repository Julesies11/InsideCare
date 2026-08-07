import { Badge } from '@/components/ui/badge';

export type StatusBadgeType =
  | 'draft'
  | 'active'
  | 'inactive'
  | 'archived'
  | 'invite_pending'
  | 'invite_expired';

interface StatusBadgeProps {
  status: StatusBadgeType | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variantMap: Record<
    string,
    {
      variant: 'warning' | 'success' | 'secondary' | 'destructive' | 'info';
      appearance: 'light' | 'outline' | 'default';
    }
  > = {
    draft: { variant: 'warning', appearance: 'light' },
    active: { variant: 'success', appearance: 'light' },
    inactive: { variant: 'secondary', appearance: 'light' },
    archived: { variant: 'secondary', appearance: 'light' },
    invite_pending: { variant: 'warning', appearance: 'light' },
    invite_expired: { variant: 'destructive', appearance: 'light' },
    no_portal: { variant: 'secondary', appearance: 'light' },
  };

  const labels: Record<string, string> = {
    draft: 'Draft',
    active: 'Active',
    inactive: 'Inactive',
    archived: 'Archived',
    invite_pending: 'Invite Pending',
    invite_expired: 'Invite Expired',
    no_portal: 'Login Disabled',
  };

  const config = variantMap[status] || {
    variant: 'secondary',
    appearance: 'light',
  };
  const label = labels[status] || status;

  return (
    <Badge
      variant={config.variant}
      appearance={config.appearance}
      size="sm"
      className={className}
    >
      {label}
    </Badge>
  );
}
