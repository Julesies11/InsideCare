import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Calendar, Users } from 'lucide-react';
import { StaffRosterCalendar, StaffRosterCalendarHandle } from './components/staff-roster-calendar';
import { RosterCalendarHeader } from '@/components/roster/roster-calendar-header';
import { ViewMode, getDateRange } from '@/components/roster/roster-utils';
import { supabase } from '@/lib/supabase';
import { format, addWeeks, addMonths, addDays } from 'date-fns';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useHouseChecklists } from '@/hooks/use-house-checklists';
import { useRosterData } from '@/components/roster/use-roster-data';
import { PublishRosterModal } from './components/PublishRosterModal';
import { BulkActionModal } from './components/BulkActionModal';
import { PopulateRosterModal } from '@/pages/houses/detail/components/PopulateRosterModal';
import { toast } from 'sonner';

interface Staff {
  id: string;
  name: string;
  photo_url?: string | null;
  status?: string;
}

interface House {
  id: string;
  name: string;
}

interface Participant {
  id: string;
  name: string;
  status?: string;
}

export function RosterBoardContent() {
  const calendarRef = useRef<StaffRosterCalendarHandle>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedStaffId, setSelectedStaffId] = useState<string>('all');
  const [staff, setStaff] = useState<Staff[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [shiftTypes, setShiftTypes] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [groupByHouse, setGroupByHouse] = useState(true);
  
  const [houseFilter, setHouseFilter] = useState<string>('all');
  const [participantFilter, setParticipantFilter] = useState<string>('all');
  const [shiftTypeFilter, setShiftTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { houseChecklists } = useHouseChecklists();
  const { bulkMaterializeTemplate, bulkUpdateShifts, bulkDeleteShifts } = useRosterData();
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkInitialHouseId, setBulkInitialHouseId] = useState<string>('all');
  const [populateModalOpen, setPopulateModalOpen] = useState(false);
  const [populateInitialHouseId, setPopulateInitialHouseId] = useState<string>('all');
  const [isCopying, setIsCopying] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    // Load staff
    const { data: staffData, error: staffError } = await supabase
      .from('staff')
      .select('id, name, photo_url, status')
      .eq('status', 'active')
      .not('name', 'is', null)
      .order('name');

    if (!staffError && staffData) {
      setStaff(staffData as Staff[]);
    }

    // Load houses
    const { data: housesData, error: housesError } = await supabase
      .from('houses')
      .select('id, name')
      .eq('status', 'active')
      .order('name');

    if (!housesError && housesData) {
      setHouses(housesData);
    }

    // Load participants
    const { data: participantsData, error: participantsError } = await supabase
      .from('participants')
      .select('id, name, status')
      .eq('status', 'active')
      .not('name', 'is', null)
      .order('name');

    if (!participantsError && participantsData) {
      setParticipants(participantsData as Participant[]);
    }

    // Load shift types (distinct names across all houses for the global filter)
    const { data: typesData } = await supabase
      .from('house_shift_types')
      .select('name')
      .eq('is_active', true)
      .order('name');
    
    if (typesData) {
      // Unique names
      const uniqueNames = Array.from(new Set(typesData.map(t => t.name)));
      setShiftTypes(uniqueNames.map(name => ({ id: name, name })));
    }

    setLoading(false);
  };

  const handleExport = async () => {
    try {
      const { startDate, endDate } = getDateRange(currentDate, viewMode);

      let query = supabase
        .from('staff_shifts')
        .select(`
          start_date, start_time, end_time, shift_type, status, notes,
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
      if (statusFilter !== 'all') query = query.eq('status', statusFilter);

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data || []).map((s: any) => ({
        Date: s.start_date,
        House: s.house?.name || '',
        Staff: s.staff?.name || 'Unassigned',
        'Shift Type': s.shift_type || '',
        Start: s.start_time?.substring(0, 5) || '',
        End: s.end_time?.substring(0, 5) || '',
        Status: s.status || '',
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

  const handlePublish = useCallback(async (params: {
    templateId: string;
    houseIds: string[];
    startDate: string;
    endDate: string;
    withAssignments?: boolean;
  }) => {
    try {
      const result = await bulkMaterializeTemplate(params);
      toast.success(
        `Published ${result.created} shifts across ${params.houseIds.length} houses. ` +
        (result.skipped > 0 ? `Skipped ${result.skipped} duplicates.` : '')
      );
    } catch (error) {
      console.error('Failed to publish roster:', error);
      toast.error('Failed to publish roster. Please try again.');
    }
  }, [bulkMaterializeTemplate]);

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

  const handleClosePublishModal = useCallback(() => setPublishModalOpen(false), []);

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
          <Button variant="default" size="sm" onClick={() => setPublishModalOpen(true)}>
            <Users className="h-4 w-4 mr-2" />
            Publish Roster
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
          <div className="flex items-center space-x-2">
            <Switch
              id="group-by-house"
              checked={groupByHouse}
              onCheckedChange={setGroupByHouse}
            />
            <Label htmlFor="group-by-house">Group By House</Label>
          </div>
          
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
            onApplyTemplate={(weeks) => calendarRef.current?.applyTemplate(weeks)}
            onPopulateRoster={() => handleOpenPopulateModal()}
            onBulkAction={() => handleOpenBulkModal()}
            isCopying={isCopying}
          />
        </CardContent>
      </Card>

      {/* Calendar */}
      {!loading && (
        <StaffRosterCalendar
          ref={calendarRef}
          staffId={selectedStaffId}
          viewMode={viewMode}
          currentDate={currentDate}
          houseFilter={houseFilter}
          participantFilter={participantFilter}
          shiftTypeFilter={shiftTypeFilter}
          statusFilter={statusFilter}
          canEdit={true}
          groupByHouse={groupByHouse}
          onBulkAction={handleOpenBulkModal}
          onPopulateRoster={handleOpenPopulateModal}
          checklists={houseChecklists}
        />
      )}

      <PublishRosterModal
        open={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        onPublish={handlePublish}
      />

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
