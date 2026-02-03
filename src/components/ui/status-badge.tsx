import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: 'draft' | 'active' | 'inactive' | 'archived';
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variantMap = {
    draft: { variant: 'warning' as const, appearance: 'light' as const },
    active: { variant: 'success' as const, appearance: 'light' as const },
    inactive: { variant: 'secondary' as const, appearance: 'light' as const },
    archived: { variant: 'secondary' as const, appearance: 'light' as const },
  };

  const labels = {
    draft: 'Draft',
    active: 'Active',
    inactive: 'Inactive',
    archived: 'Archived',
  };

  const config = variantMap[status];

  return (
    <Badge 
      variant={config.variant} 
      appearance={config.appearance}
      size="sm"
      className={className}
    >
      {labels[status]}
    </Badge>
  );
}
