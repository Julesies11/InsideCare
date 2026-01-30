import { Fragment } from 'react';
import { Container } from '@/components/common/container';
import { ShiftNotesContent } from './shift-notes-basic-content';

export function ShiftNotesPage() {
  return (
    <Fragment>
      <Container>
        <ShiftNotesContent />
      </Container>
    </Fragment>
  );
}
