import { Fragment } from 'react';
import { Container } from '@/components/common/container';
import { ShiftNotesProfilesContent } from './shift-notes-profiles-content';

export function ShiftNotesProfilesPage() {
  return (
    <Fragment>
      <Container>
        <ShiftNotesProfilesContent />
      </Container>
    </Fragment>
  );
}
