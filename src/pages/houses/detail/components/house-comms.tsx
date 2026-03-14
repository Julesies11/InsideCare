import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { MessageSquare, Plus, Calendar, User, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/context/auth-context';
import { format, subDays, addDays, isToday, parseISO } from 'date-fns';
import { toast } from 'sonner';

interface HouseCommEntry {
  id: string;
  entry_date: string;
  content: string;
  created_at: string;
  created_by: string;
  creator?: {
    name: string;
  };
}

interface HouseCommsProps {
  houseId: string;
}

export function HouseComms({ houseId }: HouseCommsProps) {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [entries, setEntries] = useState<HouseCommEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEntryContent, setNewEntryContent] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchEntries = async (date: Date) => {
    try {
      setLoading(true);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('house_comms')
        .select(`
          *,
          creator:staff!created_by(name)
        `)
        .eq('house_id', houseId)
        .eq('entry_date', dateStr)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error: any) {
      console.error('Error fetching house comms:', error);
      toast.error('Failed to load comms entries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (houseId) {
      fetchEntries(selectedDate);
    }
  }, [houseId, selectedDate]);

  const handleAddEntry = async () => {
    if (!newEntryContent.trim()) return;

    try {
      setSaving(true);
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      const { error } = await supabase
        .from('house_comms')
        .insert({
          house_id: houseId,
          entry_date: dateStr,
          content: newEntryContent.trim(),
          created_by: user?.staff_id,
        });

      if (error) throw error;

      toast.success('Communication entry added');
      setNewEntryContent('');
      setShowAddForm(false);
      fetchEntries(selectedDate);
    } catch (error: any) {
      console.error('Error adding house comms:', error);
      toast.error('Failed to add entry: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    setSelectedDate(prev => direction === 'next' ? addDays(prev, 1) : subDays(prev, 1));
  };

  return (
    <Card className="pb-2.5" id="house_comms">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="size-5 text-primary" />
            Daily Comms / Shift Handover
          </CardTitle>
          <div className="flex items-center gap-2">
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
            <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="size-4 me-1.5" />
              Add Entry
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
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
                <Button size="sm" onClick={handleAddEntry} disabled={saving || !newEntryContent.trim()}>
                  {saving ? 'Saving...' : 'Post Entry'}
                </Button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-muted-foreground animate-pulse">
              Loading entries...
            </div>
          ) : entries.length === 0 ? (
            <div className="py-12 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
              <MessageSquare className="size-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm text-muted-foreground italic">No communication entries for this date.</p>
              {!showAddForm && (
                <Button variant="link" size="sm" className="mt-2" onClick={() => setShowAddForm(true)}>
                  Start today's handover
                </Button>
              )}
            </div>
          ) : (
            <div className="relative space-y-4 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
              {entries.map((entry) => (
                <div key={entry.id} className="relative flex items-start gap-4 animate-in fade-in duration-300">
                  <div className="absolute left-0 flex items-center justify-center w-10 h-10 rounded-full bg-white border-2 border-primary shadow-sm z-10">
                    <User className="size-5 text-primary" />
                  </div>
                  <div className="flex-1 ml-12 bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:border-primary/20 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">{entry.creator?.name || 'Staff Member'}</span>
                        <span className="size-1 rounded-full bg-gray-300" />
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                          <Clock className="size-3" />
                          {format(parseISO(entry.created_at), 'h:mm a')}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {entry.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
