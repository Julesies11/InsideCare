import * as React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export interface ValidatedTextareaProps extends React.ComponentProps<'textarea'> {
  error?: string;
  errorId?: string;
  variant?: 'sm' | 'md' | 'lg';
}

const ValidatedTextarea = React.forwardRef<HTMLTextAreaElement, ValidatedTextareaProps>(
  ({ className, error, errorId, ...props }, ref) => {
    const hasError = !!error;
    const errorElementId = errorId || `${props.id}-error`;

    return (
      <div className="w-full">
        <Textarea
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

ValidatedTextarea.displayName = 'ValidatedTextarea';

export { ValidatedTextarea };
