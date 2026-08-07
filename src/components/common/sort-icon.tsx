import { memo } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SortIconProps<T extends string = string> {
  field: T;
  currentField?: T;
  direction?: 'asc' | 'desc';
  activeSort?: { id: string; desc: boolean };
  className?: string;
}

export const SortIcon = memo(function SortIcon<T extends string = string>({
  field,
  currentField,
  direction = 'asc',
  activeSort,
  className = 'size-4 ms-1 inline',
}: SortIconProps<T>) {
  const isSelected = activeSort
    ? activeSort.id === field
    : currentField === field;
  const isDesc = activeSort ? activeSort.desc : direction === 'desc';

  if (!isSelected) {
    return (
      <ArrowUpDown
        className={cn(className, 'opacity-30')}
        aria-hidden="true"
      />
    );
  }

  return isDesc ? (
    <ArrowDown className={cn(className, 'text-primary')} aria-hidden="true" />
  ) : (
    <ArrowUp className={cn(className, 'text-primary')} aria-hidden="true" />
  );
});

