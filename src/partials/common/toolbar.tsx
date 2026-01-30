import { Fragment, ReactNode } from 'react';
import { useLocation, Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { MENU_SIDEBAR } from '@/config/menu.config';
import { MenuItem } from '@/config/types';
import { useMenu } from '@/hooks/use-menu';
import { cn } from '@/lib/utils';

const Toolbar = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 py-4">
      {children}
    </div>
  );
};

const ToolbarActions = ({ children }: { children: ReactNode }) => {
  return <div className="flex items-center gap-2.5">{children}</div>;
};

const ToolbarBreadcrumbs = () => {
  const { pathname } = useLocation();
  const { getBreadcrumb, isActive } = useMenu(pathname);
  const items: MenuItem[] = getBreadcrumb(MENU_SIDEBAR);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.25 text-xs lg:text-sm font-medium mb-2.5 lg:mb-0">
      <div className="breadcrumb flex items-center gap-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const active = item.path ? isActive(item.path) : false;

          return (
            <Fragment key={index}>
              {item.path ? (
                <Link
                  to={item.path}
                  className={cn(
                    'flex items-center gap-1',
                    active
                      ? 'text-mono'
                      : 'text-muted-foreground hover:text-primary',
                  )}
                >
                  {item.title}
                </Link>
              ) : (
                <span
                  className={cn(isLast ? 'text-mono' : 'text-muted-foreground')}
                >
                  {item.title}
                </span>
              )}
              {!isLast && (
                <ChevronRight className="size-3.5 text-muted-foreground" />
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
};

const ToolbarPageTitle = ({ text }: { text?: string }) => {
  const { pathname } = useLocation();
  const { getCurrentItem } = useMenu(pathname);
  const item = getCurrentItem(MENU_SIDEBAR);

  return (
    <h1 className="text-xl font-medium leading-none text-mono">
      {text ?? item?.title}
    </h1>
  );
};

const ToolbarDescription = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex items-center gap-2 text-sm font-normal text-secondary-foreground">
      {children}
    </div>
  );
};

const ToolbarHeading = ({ children }: { children: ReactNode }) => {
  return <div className="flex flex-col justify-center gap-2">{children}</div>;
};

export {
  Toolbar,
  ToolbarActions,
  ToolbarBreadcrumbs,
  ToolbarPageTitle,
  ToolbarHeading,
  ToolbarDescription,
};
