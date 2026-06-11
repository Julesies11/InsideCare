import { HousePendingChanges } from '@/models/house-pending-changes';
import { CalendarDays } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HouseCalendarEvents } from './house-calendar-events';
import { HouseComms } from './house-comms';

interface HouseOperationsProps {
  houseId: string;
  houseName: string;
  calendarEvents: any[];
  pendingChanges: HousePendingChanges;
  onPendingChangesChange: (changes: HousePendingChanges) => void;
  canEdit: boolean;
}

export function HouseOperations({
  houseId,
  houseName,
  calendarEvents,
  pendingChanges,
  onPendingChangesChange,
  canEdit,
}: HouseOperationsProps) {
  return (
    <div id="daily_operations">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="size-5 text-gray-500" />
            Daily Operations
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-0 pt-0">
          <HouseCalendarEvents
            houseId={houseId}
            houseName={houseName}
            canEdit={canEdit}
            canDelete={canEdit}
            pendingChanges={pendingChanges}
            onPendingChangesChange={onPendingChangesChange}
            hideCardWrapper={true}
          />

          <HouseComms
            houseId={houseId}
            canEdit={canEdit}
            pendingChanges={pendingChanges}
            onPendingChangesChange={onPendingChangesChange}
            hideCardWrapper={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}
