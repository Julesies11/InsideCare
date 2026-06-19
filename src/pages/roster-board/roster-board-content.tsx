import { useCallback, useMemo, useRef, useState } from 'react';
import { PopulateRosterModal } from '@/pages/houses/detail/components/PopulateRosterModal';
import { addDays, addMonths, addWeeks, format } from 'date-fns';
import { Calendar } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { RBAC_MODULES } from '@/config/rbac-modules';
import { useHouseChecklists } from '@/hooks/use-house-checklists';
import { ACCESS_LEVEL, useRBAC } from '@/hooks/useRBAC';
import { Card, CardContent } from '@/components/ui/card';
import { RosterCalendarHeader } from '@/components/roster/roster-calendar-header';
import { getDateRange, ViewMode } from '@/components/roster/roster-utils';
import {
  useGlobalShiftTemplatesQuery,
  useRosterData,
} from '@/components/roster/use-roster-data';
import { BulkActionModal } from './components/BulkActionModal';
import {
  StaffRosterCalendar,
  StaffRosterCalendarHandle,
} from './components/staff-roster-calendar';

export function RosterBoardContent() {
  const { hasAccess } = useRBAC();
  const canEdit = hasAccess({
    resource: RBAC_MODULES.ROSTER_BOARD,
    requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE,
  });

  const calendarRef = useRef<StaffRosterCalendarHandle>(null);

  const [searchParams, setSearchParams] = useSearchParams();

  // Parse search parameters
  const viewMode = useMemo(() => {
    const val = searchParams.get('viewMode');
    if (val === 'today' || val === 'week' || val === 'month')
      return val as ViewMode;
    return 'week';
  }, [searchParams]);

  const currentDate = useMemo(() => {
    const val = searchParams.get('date');
    if (val) {
      const parsed = new Date(val + 'T00:00:00');
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  }, [searchParams]);

  const selectedStaffId = useMemo(
    () => searchParams.get('staffFilter') || 'all',
    [searchParams],
  );
  const showLeave = useMemo(
    () => searchParams.get('showLeave') !== 'false',
    [searchParams],
  );
  const showAvailability = useMemo(
    () => searchParams.get('showAvailability') === 'true',
    [searchParams],
  );
  const houseFilter = useMemo(
    () => searchParams.get('houseFilter') || 'all',
    [searchParams],
  );
  const participantFilter = useMemo(
    () => searchParams.get('participantFilter') || 'all',
    [searchParams],
  );
  const shiftTemplateFilter = useMemo(
    () => searchParams.get('shiftTemplateFilter') || 'all',
    [searchParams],
  );

  // URL State updates
  const updateUrlParam = useCallback(
    (key: string, value: string | boolean) => {
      const newParams = new URLSearchParams(searchParams);
      if (
        value === undefined ||
        value === null ||
        value === 'all' ||
        value === '' ||
        (key === 'showLeave' && value === true) ||
        (key === 'showAvailability' && value === false)
      ) {
        newParams.delete(key);
      } else {
        newParams.set(key, String(value));
      }
      setSearchParams(newParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const setViewMode = useCallback(
    (mode: ViewMode) => {
      updateUrlParam('viewMode', mode);
    },
    [updateUrlParam],
  );

  const setCurrentDate = useCallback(
    (date: Date | ((prev: Date) => Date)) => {
      let nextDate: Date;
      if (typeof date === 'function') {
        nextDate = date(currentDate);
      } else {
        nextDate = date;
      }
      updateUrlParam('date', format(nextDate, 'yyyy-MM-dd'));
    },
    [currentDate, updateUrlParam],
  );

  const setSelectedStaffId = useCallback(
    (val: string) => {
      updateUrlParam('staffFilter', val);
    },
    [updateUrlParam],
  );

  const setShowLeave = useCallback(
    (val: boolean) => {
      updateUrlParam('showLeave', val);
    },
    [updateUrlParam],
  );

  const setShowAvailability = useCallback(
    (val: boolean) => {
      updateUrlParam('showAvailability', val);
    },
    [updateUrlParam],
  );

  const setHouseFilter = useCallback(
    (val: string) => {
      updateUrlParam('houseFilter', val);
    },
    [updateUrlParam],
  );

  const setParticipantFilter = useCallback(
    (val: string) => {
      updateUrlParam('participantFilter', val);
    },
    [updateUrlParam],
  );

  const setShiftTemplateFilter = useCallback(
    (val: string) => {
      updateUrlParam('shiftTemplateFilter', val);
    },
    [updateUrlParam],
  );

  const { houseChecklists } = useHouseChecklists();
  const {
    houses,
    participants,
    staff,
    loading: rosterLoading,
    bulkUpdateShifts,
    bulkDeleteShifts,
  } = useRosterData();
  const { data: shiftTemplates = [] } = useGlobalShiftTemplatesQuery();

  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkInitialHouseId, setBulkInitialHouseId] = useState<string>('all');
  const [populateModalOpen, setPopulateModalOpen] = useState(false);
  const [populateInitialHouseId, setPopulateInitialHouseId] =
    useState<string>('all');
  const isCopying = false;

  const handleBulkAction = useCallback(
    async (params: any, action: 'update' | 'delete', updates?: any) => {
      try {
        let result;
        if (action === 'delete') {
          result = await bulkDeleteShifts(params);
        } else {
          result = await bulkUpdateShifts(params, updates);
        }
        calendarRef.current?.refresh();
        return result;
      } catch (error) {
        throw error;
      }
    },
    [bulkDeleteShifts, bulkUpdateShifts],
  );

  const handleOpenBulkModal = useCallback(
    (houseId?: string) => {
      setBulkInitialHouseId(houseId || houseFilter);
      setBulkModalOpen(true);
    },
    [houseFilter],
  );

  const handleOpenPopulateModal = useCallback(
    (houseId?: string) => {
      setPopulateInitialHouseId(houseId || houseFilter);
      setPopulateModalOpen(true);
    },
    [houseFilter],
  );

  const navigatePeriod = (direction: 'prev' | 'next') => {
    if (viewMode === 'today') {
      setCurrentDate((prev) => addDays(prev, direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      setCurrentDate((prev) => addWeeks(prev, direction === 'next' ? 1 : -1));
    } else {
      setCurrentDate((prev) => addMonths(prev, direction === 'next' ? 1 : -1));
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

  const initialFilters = useMemo(() => {
    const range = getDateRange(currentDate, viewMode);
    return {
      houseId: bulkInitialHouseId,
      staffId: selectedStaffId,
      startDate: range.startDate,
      endDate: range.endDate,
    };
  }, [bulkInitialHouseId, selectedStaffId, currentDate, viewMode]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Roster Board</h1>
          <p className="text-muted-foreground text-sm">
            Manage shift schedules and staff assignments
          </p>
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
              <h3 className="text-lg font-semibold text-indigo-900">
                Orchestrating Quality Care
              </h3>
              <p className="text-indigo-700 text-sm">
                Strategic roster management ensures consistent, reliable support
                for every participant.
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
            shiftTemplateFilter={shiftTemplateFilter}
            onShiftTemplateFilterChange={setShiftTemplateFilter}
            shiftTemplateList={shiftTemplates}
            showLeave={showLeave}
            onShowLeaveChange={setShowLeave}
            showAvailability={showAvailability}
            onShowAvailabilityChange={setShowAvailability}
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
          shiftTemplateFilter={shiftTemplateFilter}
          canEdit={canEdit}
          groupByHouse={true}
          showLeave={showLeave}
          showAvailability={showAvailability}
          includeEvents={false}
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
        shiftTemplates={shiftTemplates}
        initialFilters={initialFilters}
      />

      {populateInitialHouseId !== 'all' && (
        <PopulateRosterModal
          open={populateModalOpen}
          onOpenChange={setPopulateModalOpen}
          houseId={populateInitialHouseId}
          houseName={
            houses.find((h) => h.id === populateInitialHouseId)?.name ||
            'Selected House'
          }
          onSuccess={() => calendarRef.current?.refresh()}
        />
      )}
    </div>
  );
}
