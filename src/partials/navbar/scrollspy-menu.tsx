import { cn } from '@/lib/utils';

export interface ScrollspyMenuItem {
  title: string;
  target?: string;
  active?: boolean;
  children?: ScrollspyMenuItem[];
}
export type ScrollspyMenuItems = Array<ScrollspyMenuItem>;

export interface ScrollspyMenuProps {
  items: ScrollspyMenuItem[];
}

const ScrollspyMenu = ({ items }: ScrollspyMenuProps) => {
  const buildAnchor = (
    item: ScrollspyMenuItem,
    index: number,
    indent: boolean = false,
    isLast: boolean = false,
  ) => {
    return (
      <div
        key={index}
        data-scrollspy-anchor={item.target}
        className={cn(
          'cursor-pointer flex items-center rounded-lg pe-2.5 border border-transparent text-accent-foreground hover:text-primary data-[active=true]:bg-accent data-[active=true]:text-primary data-[active=true]:font-medium',
          indent ? 'ps-0 gap-1.5 relative py-0.5 text-xs leading-tight' : 'ps-2.5 gap-1.5 py-1 font-semibold',
        )}
      >
        {indent && (
          <>
            <span className="flex w-[26px] h-full absolute left-0 top-0">
              <span className="absolute left-[11px] top-0 bottom-1/2 w-px bg-border"></span>
              <span className={cn(
                "absolute left-[11px] top-1/2 w-[15px] h-px bg-border",
                isLast && "after:absolute after:left-0 after:top-0 after:bottom-0 after:w-px after:bg-background"
              )}></span>
            </span>
            <span className="flex w-1.5 relative ml-[26px] before:absolute start-px rtl:-start-[5px] before:top-0 before:size-1.5 before:rounded-full before:-translate-x-2/4 before:-translate-y-2/4 [[data-active=true]>&]:before:bg-primary"></span>
          </>
        )}
        {!indent && (
          <span className="flex w-1.5 relative before:absolute start-px rtl:-start-[5px] before:top-0 before:size-1.5 before:rounded-full before:-translate-x-2/4 before:-translate-y-2/4 [[data-active=true]>&]:before:bg-primary"></span>
        )}
        {item.title}
      </div>
    );
  };

  const buildSubAnchors = (items: ScrollspyMenuItems) => {
    return items.map((item, index) => {
      return buildAnchor(item, index, true, index === items.length - 1);
    });
  };

  const renderChildren = (items: ScrollspyMenuItems) => {
    return items.map((item, index) => {
      if (item.children) {
        return (
          <div key={index} className="flex flex-col">
            {item.target ? (
              <div
                key={index}
                data-scrollspy-anchor={item.target}
                className="cursor-pointer flex items-center rounded-lg pe-2.5 border border-transparent text-accent-foreground hover:text-primary data-[active=true]:bg-accent data-[active=true]:text-primary data-[active=true]:font-medium ps-2.5 gap-1.5 py-1 font-semibold"
              >
                <span className="flex w-1.5 relative before:absolute start-px rtl:-start-[5px] before:top-0 before:size-1.5 before:rounded-full before:-translate-x-2/4 before:-translate-y-2/4 [[data-active=true]>&]:before:bg-primary"></span>
                {item.title}
              </div>
            ) : (
              <div className="ps-6 pe-2.5 py-1 text-sm text-accent-foreground font-semibold">
                {item.title}
              </div>
            )}
            <div className="flex flex-col">
              {buildSubAnchors(item.children)}
            </div>
          </div>
        );
      } else {
        return buildAnchor(item, index);
      }
    });
  };

  return (
    <div className="flex flex-col grow relative before:absolute before:start-[11px] before:top-0 before:bottom-0 before:border-s before:border-border text-sm">
      {renderChildren(items)}
    </div>
  );
};

export { ScrollspyMenu };
