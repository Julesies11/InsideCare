import * as React from 'react';
import { useState } from 'react';
import { Button, ButtonArrow } from '@/components/ui/button';
import {
  Command,
  CommandCheck,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Settings } from 'lucide-react';
import { useHouseCalendarEventTypesMaster } from '@/hooks/use-house-calendar-event-types-master';

interface HouseCalendarEventTypeComboboxProps {
  value: string;
  onChange: (value: string) => void;
  onManageList: () => void;
}

export function HouseCalendarEventTypeCombobox({
  value,
  onChange,
  onManageList,
}: HouseCalendarEventTypeComboboxProps) {
  const [open, setOpen] = useState(false);
  const { data: eventTypes = [], isLoading: loading } = useHouseCalendarEventTypesMaster();

  // Filter active event types for the dropdown list
  const activeEventTypes = eventTypes.filter((type) => type.status === 'Active');
  
  // Find selected event type from full list (including inactive) so saved values display
  const selectedEventType = eventTypes.find((type) => type.id === value);

  const handleSelect = (eventTypeId: string) => {
    onChange(eventTypeId === value ? '' : eventTypeId);
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-2 w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            mode="input"
            placeholder={!selectedEventType}
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedEventType ? (
              <div className="flex items-center gap-2 truncate">
                <div className={`size-2.5 rounded-full bg-${selectedEventType.color || 'blue'}-500 shrink-0`} />
                <span className="truncate">{selectedEventType.name}</span>
              </div>
            ) : (
              <span>Select event type...</span>
            )}
            <ButtonArrow />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popper-anchor-width) p-0">
          <Command>
            <CommandInput placeholder="Search event types..." />
            <CommandList>
              <ScrollArea viewportClassName="max-h-[300px] [&>div]:block!">
                <CommandEmpty>No event type found.</CommandEmpty>
                <CommandGroup>
                  {loading ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      Loading event types...
                    </div>
                  ) : (
                    activeEventTypes.map((eventType) => (
                      <CommandItem
                        key={eventType.id}
                        value={eventType.name}
                        onSelect={() => handleSelect(eventType.id)}
                      >
                        <div className={`size-2 rounded-full bg-${eventType.color || 'blue'}-500 shrink-0`} />
                        <span className="truncate flex-1">{eventType.name}</span>
                        {value === eventType.id && <CommandCheck />}
                      </CommandItem>
                    ))
                  )}
                </CommandGroup>
              </ScrollArea>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onManageList}
        title="Manage event type list"
      >
        <Settings className="size-4" />
      </Button>
    </div>
  );
}
