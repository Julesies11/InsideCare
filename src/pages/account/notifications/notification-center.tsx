import { useState, useEffect } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  CheckCircle, 
  XCircle, 
  ClipboardList, 
  Umbrella, 
  Trash2, 
  MailOpen, 
  Mail,
  AlertTriangle,
  Stethoscope,
  CalendarDays
} from 'lucide-react';
import { useNotifications, AppNotification } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Container } from '@/components/common/container';
import { Toolbar, ToolbarHeading, ToolbarPageTitle, ToolbarDescription } from '@/partials/common/toolbar';
import { cn } from '@/lib/utils';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@/components/ui/pagination';

const TYPE_ICON: Record<string, React.ElementType> = {
  timesheet_approved: CheckCircle,
  timesheet_rejected: XCircle,
  timesheet_submitted: ClipboardList,
  leave_approved: CheckCircle,
  leave_rejected: XCircle,
  leave_submitted: Umbrella,
  system_alert: AlertTriangle,
  compliance_alert: AlertTriangle,
  clinical_update: Stethoscope,
  medication_update: Stethoscope,
  routine_update: Stethoscope,
  shift_assigned: CalendarDays,
  shift_modified: CalendarDays,
  shift_cancelled: XCircle,
};

const TYPE_COLOR: Record<string, string> = {
  timesheet_approved: 'text-green-500 bg-green-500/10',
  timesheet_rejected: 'text-destructive bg-destructive/10',
  timesheet_submitted: 'text-primary bg-primary/10',
  leave_approved: 'text-green-500 bg-green-500/10',
  leave_rejected: 'text-destructive bg-destructive/10',
  leave_submitted: 'text-primary bg-primary/10',
  system_alert: 'text-amber-500 bg-amber-500/10',
  compliance_alert: 'text-amber-500 bg-amber-500/10',
  clinical_update: 'text-purple-500 bg-purple-500/10',
  medication_update: 'text-purple-500 bg-purple-500/10',
  routine_update: 'text-purple-500 bg-purple-500/10',
  shift_assigned: 'text-blue-500 bg-blue-500/10',
  shift_modified: 'text-blue-500 bg-blue-500/10',
  shift_cancelled: 'text-destructive bg-destructive/10',
};

const ITEMS_PER_PAGE = 20;

export function NotificationCenter() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  
  const { 
    notifications, 
    loading, 
    totalCount, 
    unreadCount,
    markAllRead, 
    markRead, 
    markUnread,
    clearAll,
    clearNotification,
    refetch 
  } = useNotifications();

  // Re-fetch when page or filter changes
  useEffect(() => {
    const offset = (page - 1) * ITEMS_PER_PAGE;
    refetch(ITEMS_PER_PAGE, offset, filter === 'unread' ? false : undefined);
  }, [page, filter, refetch]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handleNotificationClick = (notification: AppNotification) => {
    if (!notification.is_read) {
      markRead(notification.id);
    }
    
    if (notification.link) {
      // For deep linking, we can pass metadata to the destination page via navigation state
      // or append it as query parameters if the link doesn't already have them.
      let targetPath = notification.link;
      
      if (notification.metadata?.tab) {
        // If the link already has a query string, append with &, else with ?
        const separator = targetPath.includes('?') ? '&' : '?';
        targetPath += `${separator}tab=${notification.metadata.tab}`;
      }
      
      navigate(targetPath, { state: { notificationMetadata: notification.metadata } });
    }
  };

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle text="Notification Center" />
            <ToolbarDescription>Manage your alerts and updates</ToolbarDescription>
          </ToolbarHeading>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={markAllRead}
              disabled={unreadCount === 0}
            >
              <CheckCircle className="size-4 mr-2" />
              Mark all read
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={clearAll}
              disabled={totalCount === 0}
            >
              <Trash2 className="size-4 mr-2" />
              Clear all
            </Button>
          </div>
        </Toolbar>
      </Container>

      <Container>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <div>
              <CardTitle>History</CardTitle>
              <CardDescription>You have {unreadCount} unread notifications.</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant={filter === 'all' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => { setFilter('all'); setPage(1); }}
              >
                All
              </Button>
              <Button 
                variant={filter === 'unread' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => { setFilter('unread'); setPage(1); }}
              >
                Unread
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Bell className="size-12 mb-4 opacity-20" />
                <p className="text-lg font-medium">No notifications found</p>
                <p className="text-sm">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => {
                  const Icon = TYPE_ICON[notification.type] ?? Bell;
                  const colorClass = TYPE_COLOR[notification.type] ?? 'text-muted-foreground bg-muted';
                  
                  return (
                    <div 
                      key={notification.id} 
                      className={cn(
                        "flex items-start gap-4 p-4 lg:p-6 transition-colors hover:bg-muted/50",
                        !notification.is_read && "bg-primary/5"
                      )}
                    >
                      <div className={cn("p-2 rounded-full shrink-0", colorClass)}>
                        <Icon className="size-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-4 mb-1">
                          <h4 
                            className={cn(
                              "text-base cursor-pointer hover:text-primary transition-colors",
                              !notification.is_read ? "font-semibold" : "font-medium"
                            )}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            {notification.title}
                          </h4>
                          <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        
                        {notification.body && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.body}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{format(new Date(notification.created_at), 'MMM d, yyyy h:mm a')}</span>
                          
                          <div className="flex items-center gap-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                notification.is_read ? markUnread(notification.id) : markRead(notification.id);
                              }}
                              className="hover:text-primary flex items-center gap-1"
                            >
                              {notification.is_read ? (
                                <><Mail className="size-3" /> Mark unread</>
                              ) : (
                                <><MailOpen className="size-3" /> Mark read</>
                              )}
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                clearNotification(notification.id);
                              }}
                              className="hover:text-destructive flex items-center gap-1"
                            >
                              <Trash2 className="size-3" /> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {!notification.is_read && (
                        <div className="size-2.5 rounded-full bg-primary shrink-0 mt-2" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t p-4 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                    </PaginationItem>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <PaginationItem key={p}>
                        <Button
                          variant={page === p ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPage(p)}
                          className="w-9"
                        >
                          {p}
                        </Button>
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        Next
                      </Button>
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>
      </Container>
    </>
  );
}
