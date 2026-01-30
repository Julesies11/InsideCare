import { useState } from 'react';
import { ClipboardList, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShiftNotes, EditShiftNoteDialog } from './components';
import { useShiftNotes, ShiftNoteUpdateData } from '@/hooks/useShiftNotes';

export function ShiftNotesContent() {
  const { createShiftNote, updateShiftNote, refetch } = useShiftNotes();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const handleAddShiftNote = () => {
    setIsAddDialogOpen(true);
  };

  return (
    <div className="grid gap-5 lg:gap-7.5">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Shift Notes
          </h1>
          <p className="text-sm text-gray-700 dark:text-gray-400">
            View and manage daily shift documentation
          </p>
        </div>
        <Button onClick={handleAddShiftNote}>
          <Plus className="size-4" />
          Add Shift Note
        </Button>
      </div>

      {/* Shift Notes Banner */}
      <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-800">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
              <ClipboardList className="size-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="text-base font-semibold text-emerald-900 dark:text-emerald-100">
                Accurate Documentation, Better Care
              </h3>
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                Detailed shift notes ensure continuity of care and help track progress toward participant goals. 
                Your observations are vital for the entire support team.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shift Notes Table */}
      <ShiftNotes />

      {/* Add Shift Note Dialog */}
      <EditShiftNoteDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        shiftNote={null}
        onSave={updateShiftNote}
        onCreate={createShiftNote}
        onSuccess={() => refetch(true)}
        mode="create"
      />
    </div>
  );
}
