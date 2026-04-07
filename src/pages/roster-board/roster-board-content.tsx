import { useState, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { StaffRosterCalendar, StaffRosterCalendarHandle } from './components/staff-roster-calendar';
import { RosterCalendarHeader } from '@/components/roster/roster-calendar-header';
import { ViewMode, getDateRange } from '@/components/roster/roster-utils';
import { format, addWeeks, addMonths, addDays } from 'date-fns';
import { useHouseChecklists } from '@/hooks/use-house-checklists';
import { useRosterData, useGlobalShiftTypesQuery } from '@/components/roster/use-roster-data';
import { BulkActionModal } from './components/BulkActionModal';
import { PopulateRosterModal } from '@/pages/houses/detail/components/PopulateRosterModal';

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

  const initialFilters = useMemo(() => ({
    houseId: bulkInitialHouseId,
    staffId: selectedStaffId,
    startDate: format(getDateRange(currentDate, viewMode).startDate, 'yyyy-MM-dd'),
    endDate: format(getDateRange(currentDate, viewMode).endDate, 'yyyy-MM-dd'),
  }), [bulkInitialHouseId, selectedStaffId, currentDate, viewMode]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Roster Board</h1>
          <p className="text-muted-foreground text-sm">Manage shift schedules and staff assignments</p>
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
        initialFilters={initialFilters}
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
