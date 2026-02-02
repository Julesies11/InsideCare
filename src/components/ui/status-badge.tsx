import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'draft' | 'active' | 'inactive' | 'archived';
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variants = {
    draft: 'badge-light-warning',
    active: 'badge-light-success',
    inactive: 'badge-light-secondary',
    archived: 'badge-light-dark',
  };

  const labels = {
    draft: 'Draft',
    active: 'Active',
    inactive: 'Inactive',
    archived: 'Archived',
  };

  return (
    <span className={cn('badge', variants[status], className)}>
      {labels[status]}
    </span>
  );
}
