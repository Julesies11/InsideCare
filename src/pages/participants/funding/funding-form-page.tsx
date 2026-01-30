import { Fragment } from 'react';
import { Container } from '@/components/common/container';
import { FundingForm } from './components/funding-form';

export function FundingFormPage() {
  return (
    <Fragment>
      <Container>
        <FundingForm />
      </Container>
    </Fragment>
  );
}
