import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageSquare, Plus, Calendar, User, Clock, ChevronLeft, ChevronRight, X, Pencil } from 'lucide-react';
import { Link } from 'react-router';
import { houseOperationsApi } from '@/api/house-operations.api';
import { useAuth } from '@/auth/context/auth-context';
import { format, subDays, addDays, isToday, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { HousePendingChanges } from '@/models/house-pending-changes';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/config/query-keys';
import { cn } from '@/lib/utils';

interface HouseCommsProps {
  houseId: string;
  canEdit: boolean;
  pendingChanges?: HousePendingChanges;
  onPendingChangesChange?: (changes: HousePendingChanges) => void;
  hideCardWrapper?: boolean;
}

export function HouseComms({ 
  houseId,
  canEdit,
  pendingChanges,
  onPendingChangesChange,
  hideCardWrapper = false
}: HouseCommsProps) {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [newEntryContent, setNewEntryContent] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const fetchEntries = async (date: Date) => {
    return await houseOperationsApi.comms.list(houseId, format(date, 'yyyy-MM-dd'));
  };

  const { data: entries = [], isLoading: loading } = useQuery({
    queryKey: [QUERY_KEYS.HOUSE_COMMS, houseId, format(selectedDate, 'yyyy-MM-dd')],
    queryFn: () => fetchEntries(selectedDate),
    enabled: !!houseId,
  });

  const handleAddEntry = () => {
    if (!newEntryContent.trim() || !pendingChanges || !onPendingChangesChange) return;

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    const newPending = {
      ...pendingChanges,
      comms: {
        ...pendingChanges.comms,
        toAdd: [
          ...pendingChanges.comms.toAdd,
          {
            tempId,
            content: newEntryContent.trim(),
            entry_date: dateStr,
            creator_name: user?.name || 'Staff Member',
          },
        ],
      },
    };

    onPendingChangesChange(newPending);
    setNewEntryContent('');
    setShowAddForm(false);
    toast.info('Entry added to save queue');
  };

  const handleSaveEdit = (id: string, isPending: boolean) => {
    if (!editContent.trim() || !pendingChanges || !onPendingChangesChange) return;

    let newPending;
    if (isPending) {
      newPending = {
        ...pendingChanges,
        comms: {
          ...pendingChanges.comms,
          toAdd: pendingChanges.comms.toAdd.map(item =>
            item.tempId === id ? { ...item, content: editContent.trim() } : item
          ),
        },
      };
    } else {
      const otherUpdates = pendingChanges.comms.toUpdate.filter(item => item.id !== id);
      newPending = {
        ...pendingChanges,
        comms: {
          ...pendingChanges.comms,
          toUpdate: [
            ...otherUpdates,
            { id, content: editContent.trim() }
          ],
        },
      };
    }

    onPendingChangesChange(newPending);
    setEditingId(null);
    setEditContent('');
    toast.info('Changes added to save queue');
  };

  const handleRemovePendingEntry = (tempId: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const newPending = {
      ...pendingChanges,
      comms: {
        ...pendingChanges.comms,
        toAdd: pendingChanges.comms.toAdd.filter(entry => entry.tempId !== tempId),
      },
    };

    onPendingChangesChange(newPending);
    if (editingId === tempId) {
      setEditingId(null);
      setEditContent('');
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    setSelectedDate(prev => direction === 'next' ? addDays(prev, 1) : subDays(prev, 1));
    setEditingId(null);
    setEditContent('');
  };

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const pendingForSelectedDate = pendingChanges?.comms.toAdd.filter(
    entry => entry.entry_date === dateStr
  ) || [];

  const commsContent = (
    <div className="space-y-4" id={hideCardWrapper ? "house_comms" : undefined}>
      {showAddForm && (
        <div className="bg-primary/5 rounded-xl p-4 border border-primary/10 animate-in fade-in slide-in-from-top-2 duration-200">
          <Label htmlFor="comm_content" className="mb-2 block text-xs font-bold uppercase text-primary">
            New Handover Note for {format(selectedDate, 'MMMM d')}
          </Label>
          <Textarea
            id="comm_content"
            placeholder="Share important updates from your shift (e.g., incidents, dinner plans, reminders)..."
            value={newEntryContent}
            onChange={(e) => setNewEntryContent(e.target.value)}
            className="min-h-[100px] bg-white"
          />
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="outline" size="sm" onClick={() => setShowAddForm(false)}>Cancel</Button>
            <Button size="sm" onClick={handleAddEntry} disabled={!newEntryContent.trim()}>
              Save
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-muted-foreground animate-pulse">
          Loading entries...
        </div>
      ) : (entries.length === 0 && pendingForSelectedDate.length === 0) ? (
        <div className="py-12 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
          <MessageSquare className="size-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm text-muted-foreground italic">No communication entries for this date.</p>
          {!showAddForm && (
            <Button variant="link" size="sm" className="mt-2" onClick={() => setShowAddForm(true)} disabled={!canEdit}>
              Start today's handover
            </Button>
          )}
        </div>
      ) : (
        <div className="relative space-y-4 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
          {/* Render Pending Entries First */}
          {pendingForSelectedDate.map((entry) => {
            const isEditing = editingId === entry.tempId;
            return (
              <div key={entry.tempId} className="relative flex items-start gap-4 animate-in fade-in duration-300">
                <div className="absolute left-0 flex items-center justify-center w-10 h-10 rounded-full bg-white border-2 border-primary shadow-sm z-10">
                  <User className="size-5 text-primary" />
                </div>
                <div className="flex-1 ml-12 bg-primary/5 rounded-xl border border-primary/20 p-4 shadow-sm relative">
                  {!isEditing && (
                    <>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-2 right-2 size-6 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemovePendingEntry(entry.tempId)}
                      >
                        <X className="size-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-2 right-8 size-6 text-muted-foreground hover:text-primary"
                        onClick={() => {
                          setEditingId(entry.tempId);
                          setEditContent(entry.content);
                        }}
                        disabled={!canEdit}
                      >
                        <Pencil className="size-3" />
                      </Button>
                    </>
                  )}
                  {isEditing ? (
                    <div className="space-y-3">
                      <Label htmlFor={`edit_pending_${entry.tempId}`} className="text-xs font-bold uppercase text-primary">
                        Edit Handover Note
                      </Label>
                      <Textarea
                        id={`edit_pending_${entry.tempId}`}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="min-h-[80px] bg-white"
                      />
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setEditingId(null);
                            setEditContent('');
                          }}
                        >
                          Cancel
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => handleSaveEdit(entry.tempId, true)} 
                          disabled={!editContent.trim()}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900">{entry.creator_name || 'Staff Member'}</span>
                          <span className="size-1 rounded-full bg-gray-300" />
                          <div className="flex items-center gap-1 text-[10px] text-primary font-bold uppercase tracking-wider">
                            <Clock className="size-3" />
                            Pending Save
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {entry.content}
                      </p>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {/* Render Existing Entries */}
          {entries.map((entry) => {
            const isEditing = editingId === entry.id;
            const pendingUpdate = pendingChanges?.comms.toUpdate.find(u => u.id === entry.id);
            const isPendingUpdate = !!pendingUpdate;
            const displayContent = pendingUpdate ? pendingUpdate.content : entry.content;

            return (
              <div key={entry.id} className="relative flex items-start gap-4 animate-in fade-in duration-300">
                <div className="absolute left-0 flex items-center justify-center w-10 h-10 rounded-full bg-white border-2 border-gray-200 shadow-sm z-10">
                  <User className="size-5 text-gray-400" />
                </div>
                <div className={cn(
                  "flex-1 ml-12 rounded-xl border p-4 shadow-sm hover:border-primary/20 transition-colors relative",
                  isPendingUpdate ? "bg-primary/5 border-primary/20" : "bg-white border-gray-100"
                )}>
                  {!isEditing && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 right-2 size-6 text-muted-foreground hover:text-primary"
                      onClick={() => {
                        setEditingId(entry.id);
                        setEditContent(displayContent);
                      }}
                      disabled={!canEdit}
                    >
                      <Pencil className="size-3" />
                    </Button>
                  )}
                  {isEditing ? (
                    <div className="space-y-3">
                      <Label htmlFor={`edit_entry_${entry.id}`} className="text-xs font-bold uppercase text-primary">
                        Edit Handover Note
                      </Label>
                      <Textarea
                        id={`edit_entry_${entry.id}`}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="min-h-[80px] bg-white"
                      />
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setEditingId(null);
                            setEditContent('');
                          }}
                        >
                          Cancel
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => handleSaveEdit(entry.id, false)} 
                          disabled={!editContent.trim()}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Link 
                            to={`/employees/staff-detail/${entry.created_by}`}
                            className="text-sm font-bold text-gray-900 hover:text-primary hover:underline transition-colors"
                          >
                            {entry.creator?.staff_name || 'Staff Member'}
                          </Link>
                          <span className="size-1 rounded-full bg-gray-300" />
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                            <Clock className="size-3" />
                            {format(parseISO(entry.created_at), 'h:mm a')}
                          </div>
                          {isPendingUpdate && (
                            <>
                              <span className="size-1 rounded-full bg-gray-300" />
                              <div className="flex items-center gap-1 text-[10px] text-primary font-bold uppercase tracking-wider">
                                <Clock className="size-3" />
                                Pending Update
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {displayContent}
                      </p>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return hideCardWrapper ? (
    <div className="flex flex-col gap-4 mt-8 pt-8 border-t border-dashed">
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-wrap items-center gap-5">
          <Label className="text-sm font-bold flex items-center gap-2">
            <MessageSquare className="size-4 text-primary" />
            Daily Comms / Shift Handover
          </Label>
          <div className="flex items-center bg-muted rounded-lg p-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="size-8" 
              onClick={() => navigateDate('prev')}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <div className="px-3 flex items-center gap-2 min-w-[140px] justify-center">
              <Calendar className="size-3.5 text-muted-foreground" />
              <span className="text-xs font-bold">
                {isToday(selectedDate) ? 'Today' : format(selectedDate, 'MMM d, yyyy')}
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="size-8" 
              onClick={() => navigateDate('next')}
              disabled={isToday(selectedDate)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
        <Button variant="secondary" size="sm" className="border border-gray-300" onClick={() => setShowAddForm(!showAddForm)} disabled={!canEdit}>
          <Plus className="size-4 me-1.5" />
          Add Entry
        </Button>
      </div>
      {commsContent}
    </div>
  ) : (
    <Card className="pb-2.5" id="house_comms">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex flex-wrap items-center gap-5">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="size-5 text-primary" />
            Daily Comms / Shift Handover
          </CardTitle>
          <div className="flex items-center bg-muted rounded-lg p-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="size-8" 
              onClick={() => navigateDate('prev')}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <div className="px-3 flex items-center gap-2 min-w-[140px] justify-center">
              <Calendar className="size-3.5 text-muted-foreground" />
              <span className="text-xs font-bold">
                {isToday(selectedDate) ? 'Today' : format(selectedDate, 'MMM d, yyyy')}
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="size-8" 
              onClick={() => navigateDate('next')}
              disabled={isToday(selectedDate)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
        <Button variant="secondary" size="sm" className="border border-gray-300" onClick={() => setShowAddForm(!showAddForm)} disabled={!canEdit}>
          <Plus className="size-4 me-1.5" />
          Add Entry
        </Button>
      </CardHeader>
      <CardContent>
        {commsContent}
      </CardContent>
    </Card>
  );
}
