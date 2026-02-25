import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Download } from 'lucide-react';
import { StaffRosterCalendar } from './components/staff-roster-calendar';
import { RosterCalendarHeader } from '@/components/roster/roster-calendar-header';
import { ViewMode } from '@/components/roster/roster-utils';
import { supabase } from '@/lib/supabase';
import { format, addWeeks, addMonths, addDays } from 'date-fns';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface Staff {
  id: string;
  name: string;
}

interface House {
  id: string;
  name: string;
}

interface Participant {
  id: string;
  name: string;
}


export function RosterBoardContent() {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedStaffId, setSelectedStaffId] = useState<string>('all');
  const [staff, setStaff] = useState<Staff[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupByHouse, setGroupByHouse] = useState(true);
  
  const [houseFilter, setHouseFilter] = useState<string>('all');
  const [participantFilter, setParticipantFilter] = useState<string>('all');
  const [shiftTypeFilter, setShiftTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    // Load staff (only active/non-draft staff with names)
    const { data: staffData, error: staffError } = await supabase
      .from('staff')
      .select('id, name')
      .neq('status', 'draft')
      .not('name', 'is', null)
      .order('name');

    if (staffError) {
      console.error('Error loading staff:', staffError);
    }
    
    if (!staffError && staffData) {
      setStaff(staffData);
    }

    // Load houses (only active)
    const { data: housesData, error: housesError } = await supabase
      .from('houses')
      .select('id, name')
      .eq('status', 'active')
      .order('name');

    if (!housesError && housesData) {
      setHouses(housesData);
    }

    // Load participants (only active)
    const { data: participantsData, error: participantsError } = await supabase
      .from('participants')
      .select('id, name')
      .eq('status', 'active')
      .not('name', 'is', null)
      .order('name');

    if (!participantsError && participantsData) {
      setParticipants(participantsData);
    }

    setLoading(false);
  };

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
      // Adjust to make Monday the start of the week (0 = Sunday, 1 = Monday, etc.)
      const dayOfWeek = currentDate.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If Sunday, go back 6 days; otherwise go back to Monday
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
          <p className="text-muted-foreground">Manage shift schedules and staff assignments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Motivational Banner */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 dark:from-indigo-950 dark:to-purple-950 dark:border-indigo-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
              <Calendar className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100">Orchestrating Quality Care</h3>
              <p className="text-indigo-700 dark:text-indigo-300">
                Strategic roster management ensures consistent, reliable support for every participant. 
                Your planning creates stability and continuity in their daily lives.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Group By House Toggle */}
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
              currentDate={currentDate}
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
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
            />
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      {!loading && (
        <StaffRosterCalendar
          staffId={selectedStaffId}
          viewMode={viewMode}
          currentDate={currentDate}
          houseFilter={houseFilter}
          participantFilter={participantFilter}
          shiftTypeFilter={shiftTypeFilter}
          statusFilter={statusFilter}
          canEdit={true}
          groupByHouse={groupByHouse}
        />
      )}
    </div>
  );
}
