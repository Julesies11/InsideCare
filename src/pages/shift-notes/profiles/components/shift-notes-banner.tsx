import { FileText } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function ShiftNotesBanner() {
  return (
    <Alert className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 dark:from-green-950/20 dark:to-emerald-950/20 dark:border-green-800">
      <div className="flex items-start gap-4">
        <div className="flex items-center justify-center size-12 rounded-full bg-green-100 dark:bg-green-900/30 shrink-0">
          <FileText className="size-6 text-green-600 dark:text-green-400" />
        </div>
        <div className="flex-1 space-y-1">
          <h3 className="text-base font-semibold text-green-900 dark:text-green-100">
            Every Note Matters
          </h3>
          <AlertDescription className="text-sm text-green-700 dark:text-green-300">
            Your detailed observations and notes help create a complete picture of each participant's journey, 
            ensuring continuity of care and celebrating progress every step of the way.
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}
