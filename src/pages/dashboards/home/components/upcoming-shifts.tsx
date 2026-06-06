import { useState, useMemo } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import { useRosterData, StaffShift, useShiftsQuery } from '@/components/roster/use-roster-data';
import { format, addDays } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { ShiftDialog, ShiftFormData } from '@/components/roster/shift-dialog';
import { toast } from 'sonner';
import { useAuth } from '@/auth/context/auth-context';
import { ROUTES } from '@/config/routes.config';
import { SecureAvatar } from '@/components/ui/secure-avatar';
import { STORAGE_BUCKETS } from '@/config/storage-buckets';

const getInitials = (name?: string) => {
  if (!name) return '??';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export function UpcomingShifts() {
  const [showShiftDialog, setShowShiftDialog] = useState(false);
  const [selectedShift, setSelectedShift] = useState<StaffShift | null>(null);
  const { user } = useAuth();
  
  // Only fetch metadata (houses, staff, participants) if the dialog is open
  const { 
    houses, 
    participants, 
    staff, 
    updateShift, 
    deleteShift,
    addShiftParticipant,
    removeShiftParticipant,
    loading: metaLoading
  } = useRosterData('all', { includeMetadata: showShiftDialog });

  const today = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const tomorrow = useMemo(() => format(addDays(new Date(), 1), 'yyyy-MM-dd'), []);

  const { shifts: allShifts = [], isLoading: shiftsLoading } = useShiftsQuery('all', today, tomorrow, undefined, false, { includeMetadata: showShiftDialog });

  const upcomingShifts = useMemo(() => {
    const now = new Date();
    return allShifts.filter(shift => {
      const shiftEnd = new Date(`${shift.end_date ?? shift.start_date}T${shift.end_time}`);
      return shiftEnd > now;
    }).slice(0, 5);
  }, [allShifts]);

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
          start_date: formData.start_date,
          end_date: formData.end_date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          house_id: formData.house_id || null,
          shift_template: formData.shift_template,
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
        toast.success('Shift updated successfully');
      }
      setShowShiftDialog(false);
    } catch (error) {
      toast.error('Failed to update shift');
      console.error(error);
    }
  };

  const handleDeleteShift = async (shiftId: string) => {
    try {
      await deleteShift(shiftId);
      toast.success('Shift deleted successfully');
      setShowShiftDialog(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete shift');
      console.error(error);
    }
  };

  const getShiftTemplateColor = (type: string) => {
    switch (type.toUpperCase()) {
      case 'SIL': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'COMMUNITY': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'SLEEPOVER': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const loading = shiftsLoading || metaLoading;

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
          {loading && upcomingShifts.length === 0 ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
              ))}
            </div>
          ) : upcomingShifts.length > 0 ? (
            <div className="space-y-3">
              {upcomingShifts.map((shift, index) => (
                <div 
                  key={shift.id} 
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-800 cursor-pointer"
                  onClick={() => handleEditShift(shift)}
                >
                  <div className="flex flex-col items-center mt-1">
                    <div className="size-2 bg-primary rounded-full"></div>
                    {index < upcomingShifts.length - 1 && (
                      <div className="w-px h-12 bg-gray-200 dark:bg-gray-800 mt-1"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <Clock className="size-3" />
                        {shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)}
                      </div>
                      <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 capitalize ${getShiftTemplateColor(shift.shift_template)}`}>
                        {shift.shift_template.toLowerCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <Link 
                        to={`${ROUTES.STAFF_DETAIL}/${shift.staff_id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 group/staff"
                      >
                        <SecureAvatar 
                          src={shift.staff_photo_url} 
                          initials={getInitials(shift.staff_name)} 
                          className="size-5 transition-all group-hover/staff:ring-2 group-hover/staff:ring-primary/20"
                          bucket={STORAGE_BUCKETS.STAFF_PHOTOS} 
                        />
                        <span className="text-sm font-semibold text-blue-700 dark:text-blue-400 hover:underline">
                          {shift.staff_name}
                        </span>
                      </Link>
                      
                      <span className="text-gray-400 text-xs font-normal px-0.5">with</span>

                      {shift.participants && shift.participants.length > 0 ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {shift.participants.map((p, i) => (
                            <div key={p.id} className="flex items-center gap-1.5">
                              <Link 
                                to={`${ROUTES.PARTICIPANT_DETAIL}/${p.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1.5 group/p"
                              >
                                <SecureAvatar 
                                  src={p.photo_url} 
                                  initials={getInitials(p.participant_name)} 
                                  className="size-5 transition-all group-hover/p:ring-2 group-hover/p:ring-primary/20"
                                  bucket={STORAGE_BUCKETS.PARTICIPANT_PHOTOS} 
                                />
                                <span className="text-sm font-semibold text-blue-700 dark:text-blue-400 hover:underline">
                                  {p.participant_name}
                                </span>
                              </Link>
                              {i < (shift.participants?.length || 0) - 1 && <span className="text-gray-300">,</span>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500 text-xs font-normal italic">No Participants</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      {shift.house?.house_name && (
                        <Link 
                          to={`${ROUTES.HOUSE_DETAIL}/${shift.house_id || shift.house.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                        >
                          <MapPin className="size-3" />
                          {shift.house.house_name}
                        </Link>
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
