import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface ValidatedSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  errorId?: string;
  id?: string;
  className?: string;
}

export function ValidatedSelect({
  value,
  onValueChange,
  options,
  placeholder,
  disabled,
  error,
  errorId,
  id,
  className,
}: ValidatedSelectProps) {
  const hasError = !!error;
  const errorElementId = errorId || `${id}-error`;

  return (
    <div className="w-full">
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger
          id={id}
          className={cn(
            hasError && 'border-red-500 focus:ring-red-500',
            className
          )}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorElementId : undefined}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hasError && (
        <p id={errorElementId} className="text-red-500 text-sm mt-1">
          {error}
        </p>
      )}
    </div>
  );
}
