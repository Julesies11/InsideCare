import { Fragment } from 'react';
import { Container } from '@/components/common/container';
import { ShiftTemplatesContent } from './shift-templates-content';

export function ShiftTemplatesPage() {
  return (
    <Fragment>
      <Container>
        <ShiftTemplatesContent />
      </Container>
    </Fragment>
  );
}
