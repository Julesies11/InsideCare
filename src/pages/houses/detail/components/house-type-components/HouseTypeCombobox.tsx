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
import { useHouseTypesMaster } from '@/hooks/use-house-types-master';

interface HouseTypeComboboxProps {
  value: string | null;
  onChange: (value: string | null) => void;
  canEdit: boolean;
  onManageList: () => void;
}

export function HouseTypeCombobox({
  value,
  onChange,
  canEdit,
  onManageList,
}: HouseTypeComboboxProps) {
  const [open, setOpen] = useState(false);
  const { data: houseTypes = [], isLoading: loading } = useHouseTypesMaster();

  // Filter active house types for the dropdown list
  const activeHouseTypes = houseTypes.filter((type) => type.status === 'Active');
  
  // Find selected house type from full list (including inactive) so saved values display
  const selectedHouseType = houseTypes.find((type) => type.id === value);

  const handleSelect = (houseTypeId: string) => {
    onChange(houseTypeId === value ? null : houseTypeId);
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
            placeholder={!selectedHouseType}
            aria-expanded={open}
            className="w-full justify-between"
            disabled={!canEdit}
          >
            {selectedHouseType ? (
              <span className="truncate">{selectedHouseType.name}</span>
            ) : (
              <span>Select house type...</span>
            )}
            <ButtonArrow />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popper-anchor-width) p-0">
          <Command>
            <CommandInput placeholder="Search house types..." />
            <CommandList>
              <ScrollArea viewportClassName="max-h-[300px] [&>div]:block!">
                <CommandEmpty>No house type found.</CommandEmpty>
                <CommandGroup>
                  {loading ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      Loading house types...
                    </div>
                  ) : (
                    activeHouseTypes.map((houseType) => (
                      <CommandItem
                        key={houseType.id}
                        value={houseType.name}
                        onSelect={() => handleSelect(houseType.id)}
                      >
                        <span className="truncate flex-1">{houseType.name}</span>
                        {value === houseType.id && <CommandCheck />}
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
        disabled={!canEdit}
        title="Manage house type list"
      >
        <Settings className="size-4" />
      </Button>
    </div>
  );
}
