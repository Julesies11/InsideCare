import { Navbar } from '@/partials/navbar/navbar';
import { NavbarMenu } from '@/partials/navbar/navbar-menu';
import { MENU_SIDEBAR } from '@/config/menu.config';
import { useSettings } from '@/providers/settings-provider';
import { Container } from '@/components/common/container';

const PageNavbar = () => {
  const { settings } = useSettings();
  // Find the Participants menu item dynamically
  const participantsMenu = MENU_SIDEBAR?.find(item => item.title === 'Participants');
  const participantsMenuConfig = participantsMenu?.children;

  if (participantsMenuConfig && settings?.layout === 'demo1') {
    return (
      <Navbar>
        <Container>
          <NavbarMenu items={participantsMenuConfig} />
        </Container>
      </Navbar>
    );
  } else {
    return <></>;
  }
};

export { PageNavbar };
