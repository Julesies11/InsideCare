import { Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export interface StatusOption {
  value: string;
  label: string;
  badge?: 'success' | 'warning' | 'secondary' | 'dark';
}

export interface StatusFilterProps {
  value: string[];
  onChange: (value: string[]) => void;
  options: StatusOption[];
  label?: string;
  defaultValue?: string[];
  className?: string;
  disabled?: boolean;
}

export function StatusFilter({
  value,
  onChange,
  options,
  label = 'Status',
  disabled = false,
  className,
}: StatusFilterProps) {
  const handleToggle = (statusValue: string, checked: boolean) => {
    if (checked) {
      onChange([...value, statusValue]);
    } else {
      onChange(value.filter((v) => v !== statusValue));
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" disabled={disabled} className={className}>
          <Filter className="size-4" />
          {label}
          <Badge size="sm" variant="outline">
            {value.length}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="start">
        <div className="space-y-3">
          <div className="text-xs font-medium text-muted-foreground">
            Filter by {label}
          </div>

          {options.map((option) => (
            <div key={option.value} className="flex items-center gap-2">
              <Checkbox
                id={`status-${option.value}`}
                checked={value.includes(option.value)}
                onCheckedChange={(checked) =>
                  handleToggle(option.value, checked as boolean)
                }
                disabled={disabled}
              />
              <Label
                htmlFor={`status-${option.value}`}
                className="font-normal cursor-pointer capitalize"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
