import { Fragment } from 'react';
import { Container } from '@/components/common/container';
import { HousesProfilesContent } from './houses-basic-content';

export function HousesProfilesPage() {
  return (
    <Fragment>
      <Container>
        <HousesProfilesContent />
      </Container>
    </Fragment>
  );
}
