import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const BRISTOL_TYPES = [
  {
    type: 1,
    description: 'Separate hard lumps, like nuts (hard to pass)',
    example: 'Type 1: Severe Constipation',
    color: 'bg-red-100 border-red-200 text-red-700',
    icon: '🟤',
  },
  {
    type: 2,
    description: 'Sausage-shaped but lumpy',
    example: 'Type 2: Mild Constipation',
    color: 'bg-orange-100 border-orange-200 text-orange-700',
    icon: '💩',
  },
  {
    type: 3,
    description: 'Like a sausage but with cracks on the surface',
    example: 'Type 3: Normal',
    color: 'bg-green-100 border-green-200 text-green-700',
    icon: '🌭',
  },
  {
    type: 4,
    description: 'Like a sausage or snake, smooth and soft',
    example: 'Type 4: Ideal',
    color: 'bg-emerald-100 border-emerald-200 text-emerald-700',
    icon: '🐍',
  },
  {
    type: 5,
    description: 'Soft blobs with clear-cut edges (passed easily)',
    example: 'Type 5: Lacking Fibre',
    color: 'bg-blue-100 border-blue-200 text-blue-700',
    icon: '💧',
  },
  {
    type: 6,
    description: 'Fluffy pieces with ragged edges, a mushy stool',
    example: 'Type 6: Mild Diarrhoea',
    color: 'bg-yellow-100 border-yellow-200 text-yellow-700',
    icon: '🌪️',
  },
  {
    type: 7,
    description: 'Watery, no solid pieces (entirely liquid)',
    example: 'Type 7: Severe Diarrhoea',
    color: 'bg-red-100 border-red-200 text-red-700',
    icon: '🌊',
  },
];

interface BristolScalePickerProps {
  value: number | null;
  onChange: (value: number | null) => void;
  disabled?: boolean;
}

export function BristolScalePicker({
  value,
  onChange,
  disabled = false,
}: BristolScalePickerProps) {
  return (
    <TooltipProvider>
      <div className="flex flex-row gap-2 py-2">
        {BRISTOL_TYPES.map((bt) => (
          <Tooltip key={bt.type}>
            <TooltipTrigger asChild>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(value === bt.type ? null : bt.type)}
                className={cn(
                  'flex items-center justify-center rounded-lg border-2 transition-all size-10 font-bold',
                  value === bt.type
                    ? cn(bt.color, 'border-current shadow-sm scale-110 z-10')
                    : 'border-transparent bg-muted/50 hover:bg-muted hover:border-border text-muted-foreground hover:text-foreground',
                  disabled && 'opacity-50 cursor-not-allowed',
                )}
              >
                {bt.type}
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              className="max-w-[200px] text-center p-2"
            >
              <p className="font-bold text-xs">{bt.example}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {bt.description}
              </p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
