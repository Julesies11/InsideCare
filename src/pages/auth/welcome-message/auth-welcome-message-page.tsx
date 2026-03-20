import { Fragment, useState } from 'react';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/partials/common/toolbar';
import { WelcomeMessageDialog } from '@/partials/dialogs/welcome-message-dialog';
import { Container } from '@/components/common/container';

export function AuthWelcomeMessagePage() {
  const [profileModalOpen, setProfileModalOpen] = useState(true);
  const handleClose = () => {
    setProfileModalOpen(false);
  };

  return (
    <Fragment>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle />
          </ToolbarHeading>
        </Toolbar>
      </Container>
      <Container>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center bg-primary/5 rounded-xl border border-primary/20 border-dashed">
          <h1 className="text-2xl font-bold text-primary mb-2">Welcome!</h1>
          <p className="text-gray-600 max-w-md">
            We're glad to have you on board. Please follow the instructions in the dialog to complete your setup.
          </p>
        </div>
        <WelcomeMessageDialog
          open={profileModalOpen}
          onOpenChange={handleClose}
        />
      </Container>
    </Fragment>
  );
}
