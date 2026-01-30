import { Fragment } from 'react';
import { Container } from '@/components/common/container';
import { FundingContent } from './funding-content';

export function FundingPage() {
  return (
    <Fragment>
      <Container>
        <FundingContent />
      </Container>
    </Fragment>
  );
}
