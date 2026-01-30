import { ShiftNotes } from './components/shift-notes';
import { ShiftNotesBanner } from './components/shift-notes-banner';

export function ShiftNotesProfilesContent() {
  return (
    <div className="space-y-5 lg:space-y-7.5">
      <ShiftNotesBanner />
      <ShiftNotes />
    </div>
  );
}
