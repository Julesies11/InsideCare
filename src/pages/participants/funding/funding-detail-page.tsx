import { Fragment } from 'react';
import { Container } from '@/components/common/container';
import { FundingDetail } from './components/funding-detail';

export function FundingDetailPage() {
  return (
    <Fragment>
      <Container>
        <FundingDetail />
      </Container>
    </Fragment>
  );
}
