import { Fragment } from 'react';
import { Container } from '@/components/common/container';
import { ParticipantsProfilesContent } from './participants-basic-content';

export function ParticipantsProfilesPage() {
  return (
    <Fragment>
      <Container>
        <ParticipantsProfilesContent />
      </Container>
    </Fragment>
  );
}
