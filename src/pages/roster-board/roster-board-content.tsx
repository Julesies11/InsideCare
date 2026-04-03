import { useState, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Calendar } from 'lucide-react';
import { StaffRosterCalendar, StaffRosterCalendarHandle } from './components/staff-roster-calendar';
import { RosterCalendarHeader } from '@/components/roster/roster-calendar-header';
import { ViewMode, getDateRange } from '@/components/roster/roster-utils';
import { supabase } from '@/lib/supabase';
import { format, addWeeks, addMonths, addDays } from 'date-fns';
import { useHouseChecklists } from '@/hooks/use-house-checklists';
import { useRosterData, useGlobalShiftTypesQuery } from '@/components/roster/use-roster-data';
import { BulkActionModal } from './components/BulkActionModal';
import { PopulateRosterModal } from '@/pages/houses/detail/components/PopulateRosterModal';
import { toast } from 'sonner';

export function RosterBoardContent() {
  const calendarRef = useRef<StaffRosterCalendarHandle>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedStaffId, setSelectedStaffId] = useState<string>('all');
  
  const [houseFilter, setHouseFilter] = useState<string>('all');
  const [participantFilter, setParticipantFilter] = useState<string>('all');
  const [shiftTypeFilter, setShiftTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { houseChecklists } = useHouseChecklists();
  const { 
    houses, 
    participants, 
    staff, 
    loading: rosterLoading,
    bulkUpdateShifts, 
    bulkDeleteShifts 
  } = useRosterData();
  const { data: shiftTypes = [] } = useGlobalShiftTypesQuery();

  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkInitialHouseId, setBulkInitialHouseId] = useState<string>('all');
  const [populateModalOpen, setPopulateModalOpen] = useState(false);
  const [populateInitialHouseId, setPopulateInitialHouseId] = useState<string>('all');
  const isCopying = false;

  const handleExport = async () => {
    try {
      const { startDate, endDate } = getDateRange(currentDate, viewMode);

      let query = supabase
        .from('staff_shifts')
        .select(`
          start_date, start_time, end_time, shift_type, notes,
          house:houses(name),
          staff:staff(name),
          participants:shift_participants(participant:participants(name)),
          assigned_checklists:shift_assigned_checklists(assignment_title)
        `)
        .gte('start_date', startDate)
        .lte('start_date', endDate)
        .order('start_date')
        .order('start_time');

      if (houseFilter !== 'all') query = query.eq('house_id', houseFilter);
      if (selectedStaffId !== 'all') query = query.eq('staff_id', selectedStaffId);

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data || []).map((s: any) => ({
        Date: s.start_date,
        House: s.house?.name || '',
        Staff: s.staff?.name || 'Unassigned',
        'Shift Type': s.shift_type || '',
        Start: s.start_time?.substring(0, 5) || '',
        End: s.end_time?.substring(0, 5) || '',
        Participants: (s.participants || []).map((p: any) => p.participant?.name).filter(Boolean).join('; '),
        Checklists: (s.assigned_checklists || []).map((c: any) => c.assignment_title).join('; '),
        Notes: s.notes || '',
      }));

      if (rows.length === 0) {
        toast.error('No shifts found for the current view.');
        return;
      }

      const headers = Object.keys(rows[0]);
      const csv = [
        headers.join(','),
        ...rows.map(row =>
          headers.map(h => {
            const val = String((row as any)[h] ?? '').replace(/"/g, '""');
            return val.includes(',') || val.includes('"') || val.includes('\n') ? `"${val}"` : val;
          }).join(',')
        )
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `roster-${startDate}-to-${endDate}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Failed to export roster.');
    }
  };

  const handleBulkAction = useCallback(async (params: any, action: 'update' | 'delete', updates?: any) => {
    try {
      if (action === 'delete') {
        await bulkDeleteShifts(params);
      } else {
        await bulkUpdateShifts(params, updates);
      }
      calendarRef.current?.refresh();
    } catch (error) {
      throw error;
    }
  }, [bulkDeleteShifts, bulkUpdateShifts]);

  const handleOpenBulkModal = useCallback((houseId?: string) => {
    setBulkInitialHouseId(houseId || houseFilter);
    setBulkModalOpen(true);
  }, [houseFilter]);

  const handleOpenPopulateModal = useCallback((houseId?: string) => {
    setPopulateInitialHouseId(houseId || houseFilter);
    setPopulateModalOpen(true);
  }, [houseFilter]);

  const navigatePeriod = (direction: 'prev' | 'next') => {
    if (viewMode === 'today') {
      setCurrentDate(prev => addDays(prev, direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      setCurrentDate(prev => addWeeks(prev, direction === 'next' ? 1 : -1));
    } else {
      setCurrentDate(prev => addMonths(prev, direction === 'next' ? 1 : -1));
    }
  };

  const getPeriodLabel = () => {
    if (viewMode === 'today') {
      return format(currentDate, 'EEEE, MMMM d, yyyy');
    } else if (viewMode === 'week') {
      const weekStart = new Date(currentDate);
      const dayOfWeek = currentDate.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      weekStart.setDate(currentDate.getDate() - daysToMonday);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return `Week of ${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
    } else {
      return format(currentDate, 'MMMM yyyy');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Roster Board</h1>
          <p className="text-muted-foreground text-sm">Manage shift schedules and staff assignments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Motivational Banner */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
              <Calendar className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-indigo-900">Orchestrating Quality Care</h3>
              <p className="text-indigo-700 text-sm">
                Strategic roster management ensures consistent, reliable support for every participant.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <RosterCalendarHeader
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onNavigate={navigatePeriod}
            getPeriodLabel={getPeriodLabel}
            showStaffFilter={true}
            showParticipantFilter={true}
            staffFilter={selectedStaffId}
            onStaffFilterChange={setSelectedStaffId}
            staffList={staff}
            participantFilter={participantFilter}
            onParticipantFilterChange={setParticipantFilter}
            participantList={participants}
            houseFilter={houseFilter}
            onHouseFilterChange={setHouseFilter}
            houseList={houses}
            shiftTypeFilter={shiftTypeFilter}
            onShiftTypeFilterChange={setShiftTypeFilter}
            shiftTypeList={shiftTypes}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onPopulateRoster={() => handleOpenPopulateModal()}
            onBulkAction={() => handleOpenBulkModal()}
            isCopying={isCopying}
          />
        </CardContent>
      </Card>

      {/* Calendar */}
      {!rosterLoading && (
        <StaffRosterCalendar
          ref={calendarRef}
          staffId={selectedStaffId}
          viewMode={viewMode}
          currentDate={currentDate}
          houseFilter={houseFilter}
          participantFilter={participantFilter}
          shiftTypeFilter={shiftTypeFilter}
          canEdit={true}
          groupByHouse={true}
          onBulkAction={handleOpenBulkModal}
          onPopulateRoster={handleOpenPopulateModal}
          checklists={houseChecklists}
        />
      )}

      <BulkActionModal
        key={bulkModalOpen ? `bulk-${bulkInitialHouseId}` : 'bulk-closed'}
        open={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        onConfirm={handleBulkAction}
        houses={houses}
        staff={staff}
        shiftTypes={shiftTypes}
        initialFilters={{
          houseId: bulkInitialHouseId,
          staffId: selectedStaffId,
          startDate: format(getDateRange(currentDate, viewMode).startDate, 'yyyy-MM-dd'),
          endDate: format(getDateRange(currentDate, viewMode).endDate, 'yyyy-MM-dd'),
        }}
      />

      {populateInitialHouseId !== 'all' && (
        <PopulateRosterModal
          open={populateModalOpen}
          onOpenChange={setPopulateModalOpen}
          houseId={populateInitialHouseId}
          houseName={houses.find(h => h.id === populateInitialHouseId)?.name || 'Selected House'}
          onSuccess={() => calendarRef.current?.refresh()}
        />
      )}
    </div>
  );
}
