import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, User, Users } from 'lucide-react';
import { useRosterData, StaffShift } from '@/components/roster/use-roster-data';
import { format, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { ShiftDialog, ShiftFormData } from '@/components/roster/shift-dialog';
import { toast } from 'sonner';
import { logActivity } from '@/hooks/use-activity-log';
import { useAuth } from '@/auth/context/auth-context';

export function UpcomingShifts() {
  const [shifts, setShifts] = useState<StaffShift[]>([]);
  const [showShiftDialog, setShowShiftDialog] = useState(false);
  const [selectedShift, setSelectedShift] = useState<StaffShift | null>(null);
  const { user } = useAuth();
  
  const { 
    loadShifts, 
    loading, 
    houses, 
    participants, 
    staff, 
    loadAllData, 
    updateShift, 
    deleteShift,
    addShiftParticipant,
    removeShiftParticipant
  } = useRosterData();

  const fetchTodayShifts = useCallback(async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    // Fetch shifts for today and tomorrow to ensure we have "upcoming"
    const tomorrow = format(new Date(Date.now() + 86400000), 'yyyy-MM-dd');
    const data = await loadShifts('all', today, tomorrow);
    
    // Filter for shifts that haven't ended yet
    const now = new Date();
    const upcoming = data.filter(shift => {
      const shiftEnd = new Date(`${shift.end_date ?? shift.shift_date}T${shift.end_time}`);
      return shiftEnd > now;
    }).slice(0, 5); // Just show top 5
    
    setShifts(upcoming);
  }, [loadShifts]);

  useEffect(() => {
    loadAllData();
    fetchTodayShifts();
  }, [loadAllData, fetchTodayShifts]);

  const handleEditShift = (shift: StaffShift) => {
    setSelectedShift(shift);
    setShowShiftDialog(true);
  };

  const handleSaveShift = async (formData: ShiftFormData) => {
    try {
      if (selectedShift) {
        // Update basic shift info
        await updateShift(selectedShift.id, {
          staff_id: formData.staff_id,
          shift_date: formData.shift_date,
          end_date: formData.end_date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          house_id: formData.house_id || null,
          shift_type: formData.shift_type,
          status: formData.status,
          notes: formData.notes,
        });

        // Handle participant changes
        const currentParticipantIds = selectedShift.participants?.map(p => p.id) || [];
        const newParticipantIds = formData.participant_ids;

        const toAdd = newParticipantIds.filter(id => !currentParticipantIds.includes(id));
        const toRemove = currentParticipantIds.filter(id => !newParticipantIds.includes(id));

        for (const pId of toAdd) {
          await addShiftParticipant(selectedShift.id, pId);
        }
        for (const pId of toRemove) {
          await removeShiftParticipant(selectedShift.id, pId);
        }

        // Log activity
        const staffMember = staff.find(s => s.id === formData.staff_id);
        await logActivity({
          activityType: 'update',
          entityType: 'shift_note', // Using shift_note as proxy for roster activity
          entityId: selectedShift.id,
          entityName: `Shift for ${staffMember?.name || 'Unknown'}`,
          userName: user?.email || 'Unknown',
          customDescription: `Updated shift on ${formData.shift_date}`,
        });

        toast.success('Shift updated successfully');
        fetchTodayShifts();
      }
    } catch (error) {
      toast.error('Failed to update shift');
      console.error(error);
    }
  };

  const handleDeleteShift = async (shiftId: string) => {
    try {
      await deleteShift(shiftId);
      
      // Log activity
      await logActivity({
        activityType: 'delete',
        entityType: 'shift_note',
        entityId: shiftId,
        userName: user?.email || 'Unknown',
        customDescription: `Deleted a shift`,
      });

      toast.success('Shift deleted successfully');
      fetchTodayShifts();
    } catch (error) {
      toast.error('Failed to delete shift');
      console.error(error);
    }
  };

  const getShiftTypeColor = (type: string) => {
    switch (type.toUpperCase()) {
      case 'SIL': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'COMMUNITY': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'SLEEPOVER': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  return (
    <>
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Calendar className="size-5 text-primary" />
            Upcoming Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && shifts.length === 0 ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
              ))}
            </div>
          ) : shifts.length > 0 ? (
            <div className="space-y-3">
              {shifts.map((shift, index) => (
                <div 
                  key={shift.id} 
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-800 cursor-pointer"
                  onClick={() => handleEditShift(shift)}
                >
                  <div className="flex flex-col items-center mt-1">
                    <div className="size-2 bg-primary rounded-full"></div>
                    {index < shifts.length - 1 && (
                      <div className="w-px h-12 bg-gray-200 dark:bg-gray-800 mt-1"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <Clock className="size-3" />
                        {shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)}
                      </div>
                      <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 capitalize ${getShiftTypeColor(shift.shift_type)}`}>
                        {shift.shift_type.toLowerCase()}
                      </Badge>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {shift.staff_name} with {shift.participants?.map(p => p.name).join(', ') || 'No Participants'}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      {shift.house?.name && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="size-3" />
                          {shift.house.name}
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="size-3" />
                        {shift.participants?.length || 0}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">No upcoming shifts scheduled</p>
            </div>
          )}
        </CardContent>
      </Card>

      {showShiftDialog && (
        <ShiftDialog
          open={showShiftDialog}
          onOpenChange={setShowShiftDialog}
          shift={selectedShift}
          staffList={staff}
          staffSelectionDisabled={false}
          houses={houses}
          participants={participants}
          onSave={handleSaveShift}
          onDelete={handleDeleteShift}
        />
      )}
    </>
  );
}
