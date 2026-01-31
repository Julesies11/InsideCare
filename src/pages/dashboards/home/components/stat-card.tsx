import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function StatCard({ title, value, icon: Icon, color, onClick, disabled }: StatCardProps) {
  return (
    <Card 
      className={cn(
        'transition-all',
        disabled ? 'opacity-50 cursor-not-allowed' : onClick ? 'cursor-pointer hover:shadow-md' : ''
      )}
      onClick={disabled ? undefined : onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-muted-foreground">{title}</span>
            <span className="text-3xl font-semibold">{value}</span>
          </div>
          <div className={cn('flex items-center justify-center size-12 rounded-full', color)}>
            <Icon className="size-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
