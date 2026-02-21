import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Bell, CheckCircle, XCircle, ClipboardList, Umbrella } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useNotifications, AppNotification } from '@/hooks/useNotifications';

const TYPE_ICON: Record<string, React.ElementType> = {
  timesheet_approved: CheckCircle,
  timesheet_rejected: XCircle,
  timesheet_submitted: ClipboardList,
  leave_approved: CheckCircle,
  leave_rejected: XCircle,
  leave_submitted: Umbrella,
};

const TYPE_COLOR: Record<string, string> = {
  timesheet_approved: 'text-green-500',
  timesheet_rejected: 'text-destructive',
  timesheet_submitted: 'text-primary',
  leave_approved: 'text-green-500',
  leave_rejected: 'text-destructive',
  leave_submitted: 'text-primary',
};

function NotificationItem({ notification, onRead }: { notification: AppNotification; onRead: (id: string) => void }) {
  const navigate = useNavigate();
  const Icon = TYPE_ICON[notification.type] ?? Bell;
  const iconColor = TYPE_COLOR[notification.type] ?? 'text-muted-foreground';

  const handleClick = () => {
    if (!notification.is_read) onRead(notification.id);
    if (notification.link) navigate(notification.link);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full text-left px-5 py-3 flex gap-3 hover:bg-muted/50 transition-colors',
        !notification.is_read && 'bg-primary/5',
      )}
    >
      <div className={cn('mt-0.5 shrink-0', iconColor)}>
        <Icon className="size-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm', !notification.is_read && 'font-medium')}>
          {notification.title}
        </p>
        {notification.body && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{notification.body}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </p>
      </div>
      {!notification.is_read && (
        <div className="mt-1.5 size-2 rounded-full bg-primary shrink-0" />
      )}
    </button>
  );
}

export function NotificationsSheet({ trigger }: { trigger: ReactNode }) {
  const { notifications, loading, unreadCount, markAllRead, markRead } = useNotifications();

  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="p-0 gap-0 sm:w-[420px] sm:max-w-none inset-5 start-auto h-auto rounded-lg [&_[data-slot=sheet-close]]:top-4.5 [&_[data-slot=sheet-close]]:end-5">
        <SheetHeader className="mb-0 border-b">
          <div className="flex items-center justify-between px-5 py-4">
            <SheetTitle className="flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center size-5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </SheetTitle>
          </div>
        </SheetHeader>
        <SheetBody className="grow p-0">
          <ScrollArea className="h-[calc(100vh-10.5rem)]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Bell className="size-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((n) => (
                  <NotificationItem key={n.id} notification={n} onRead={markRead} />
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetBody>
        <SheetFooter className="border-t border-border p-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={markAllRead}
            disabled={unreadCount === 0}
          >
            Mark all as read
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
