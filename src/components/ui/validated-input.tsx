import * as React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface ValidatedInputProps extends React.ComponentProps<'input'> {
  error?: string;
  errorId?: string;
  variant?: 'sm' | 'md' | 'lg';
}

const ValidatedInput = React.forwardRef<HTMLInputElement, ValidatedInputProps>(
  ({ className, error, errorId, ...props }, ref) => {
    const hasError = !!error;
    const errorElementId = errorId || `${props.id}-error`;

    return (
      <div className="w-full">
        <Input
          ref={ref}
          className={cn(
            hasError && 'border-red-500 focus-visible:ring-red-500',
            className
          )}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorElementId : undefined}
          {...props}
        />
        {hasError && (
          <p id={errorElementId} className="text-red-500 text-sm mt-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);

ValidatedInput.displayName = 'ValidatedInput';

export { ValidatedInput };
