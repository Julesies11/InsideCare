import { Fragment } from 'react';
import { Container } from '@/components/common/container';
import { StaffProfilesContent } from './staff-profiles-content';

export function StaffProfilesPage() {
  return (
    <Fragment>
      <Container>
        <StaffProfilesContent />
      </Container>
    </Fragment>
  );
}
