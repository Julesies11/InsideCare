import { Fragment } from 'react';
import { ChevronRight } from 'lucide-react';
import { useLocation, Link } from 'react-router';
import { MENU_SIDEBAR } from '@/config/menu.config';
import { MenuItem } from '@/config/types';
import { cn } from '@/lib/utils';
import { useMenu } from '@/hooks/use-menu';

export function Breadcrumb() {
  const { pathname } = useLocation();
  const { getBreadcrumb, isActive } = useMenu(pathname);
  const items: MenuItem[] = getBreadcrumb(MENU_SIDEBAR);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.25 text-xs lg:text-sm font-medium mb-2.5 lg:mb-0">
      {items.map((item, index) => {
        const last = index === items.length - 1;
        const active = item.path ? isActive(item.path) : false;
        const hasPath = item.path && item.path !== '#';

        // Special handling for detail pages to show entity name
        let displayTitle = item.title;
        if (last && (pathname.includes('/staff-detail/') || pathname.includes('/participants/detail/'))) {
          const entityName = (window as any).entityName;
          if (entityName) displayTitle = entityName;
        }

        return (
          <Fragment key={`root-${index}`}>
            {hasPath && !last ? (
              <Link
                to={item.path!}
                className={cn(
                  'hover:text-primary transition-colors cursor-pointer',
                  active ? 'text-mono' : 'text-secondary-foreground'
                )}
                key={`item-${index}`}
              >
                {displayTitle}
              </Link>
            ) : (
              <span
                className={cn(
                  last ? 'cursor-default' : '',
                  active ? 'text-mono' : 'text-secondary-foreground'
                )}
                key={`item-${index}`}
              >
                {displayTitle}
              </span>
            )}
            {!last && (
              <ChevronRight
                className="size-3.5 text-muted-foreground"
                key={`separator-${index}`}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
