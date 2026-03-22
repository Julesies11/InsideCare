import { useEffect, useState } from 'react';
import { useAuth } from '@/auth/context/auth-context';
import { NotificationsSheet } from '@/partials/topbar/notifications-sheet';
import { UserDropdownMenu } from '@/partials/topbar/user-dropdown-menu';
import { useNotifications } from '@/hooks/useNotifications';
import {
  Bell,
  Menu,
} from 'lucide-react';
import { useLocation } from 'react-router';
import { Link } from 'react-router-dom';
import { toAbsoluteUrl } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useScrollPosition } from '@/hooks/use-scroll-position';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Container } from '@/components/common/container';
import { SidebarMenu } from './sidebar-menu';

export function Header() {
  const [isSidebarSheetOpen, setIsSidebarSheetOpen] = useState(false);
  const { unreadCount } = useNotifications();
  const { user } = useAuth();
  const initials = (user?.staff_name
    ? user.staff_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : [user?.first_name, user?.last_name]
        .filter(Boolean)
        .map((n) => n![0].toUpperCase())
        .join('')
  ) || (user?.email?.[0]?.toUpperCase() ?? '?');

  const { pathname } = useLocation();
  const mobileMode = useIsMobile();

  const scrollPosition = useScrollPosition();
  const headerSticky: boolean = scrollPosition > 0;

  // Close sheet when route changes
  useEffect(() => {
    setIsSidebarSheetOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        'header fixed top-0 z-10 start-0 flex items-stretch shrink-0 border-b border-transparent bg-background end-0 pe-[var(--removed-body-scroll-bar-size,0px)]',
        headerSticky && 'border-b border-border',
      )}
    >
      <Container className="flex justify-between items-stretch lg:gap-4">
        {/* HeaderLogo */}
        <div className="flex gap-1 lg:hidden items-center gap-2.5">
          <Link to="/" className="shrink-0">
            <img
              src={toAbsoluteUrl('/media/app/mini-logo.png')}
              className="h-[25px] w-full"
              alt="mini-logo"
            />
          </Link>
          <div className="flex items-center">
            {mobileMode && (
              <Sheet
                open={isSidebarSheetOpen}
                onOpenChange={setIsSidebarSheetOpen}
              >
                <SheetTrigger asChild>
                  <Button variant="ghost" mode="icon">
                    <Menu className="text-muted-foreground/70" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  className="p-0 gap-0 w-[275px]"
                  side="left"
                  close={false}
                  title="Sidebar Menu"
                >
                  <SheetHeader className="p-0 space-y-0" />
                  <SheetBody className="p-0 overflow-y-auto">
                    <SidebarMenu />
                  </SheetBody>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>


        {/* Main Content (MegaMenu or Breadcrumbs) */}
        <div className="flex items-center grow">
          {/* <Breadcrumb /> */}
        </div>

        {/* HeaderTopbar */}
        <div className="flex items-center gap-3">
          <>
            <NotificationsSheet
                trigger={
                  <Button
                    variant="ghost"
                    mode="icon"
                    shape="circle"
                    className="relative size-9 hover:bg-primary/10 hover:[&_svg]:text-primary"
                  >
                    <Bell className="size-4.5!" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 end-1 size-2 rounded-full bg-red-500" />
                    )}
                  </Button>
                }
              />
              <UserDropdownMenu
                trigger={
                  <Avatar className="size-9 border-2 border-green-500 shrink-0 cursor-pointer">
                    {user?.photo_url && <AvatarImage src={user.photo_url} alt="User Avatar" className="object-cover" />}
                    <AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
                  </Avatar>
                }
              />
            </>
        </div>
      </Container>
    </header>
  );
}
