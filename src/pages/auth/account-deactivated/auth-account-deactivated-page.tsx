import { Fragment, useState } from 'react';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/partials/common/toolbar';
import { AccountDeactivatedDialog } from '@/partials/dialogs/account-deactivated-dialog';
import { Container } from '@/components/common/container';

export function AuthAccountDeactivatedPage() {
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
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center bg-destructive/5 rounded-xl border border-destructive/20 border-dashed">
          <h1 className="text-2xl font-bold text-destructive mb-2">Account Deactivated</h1>
          <p className="text-gray-600 max-w-md">
            Your access to InsideCare has been suspended. Please contact your administrator if you believe this is an error.
          </p>
        </div>
        <AccountDeactivatedDialog
          open={profileModalOpen}
          onOpenChange={handleClose}
        />
      </Container>
    </Fragment>
  );
}
