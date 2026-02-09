import * as React from 'react';
import { useState, useEffect } from 'react';
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
import { useEmploymentTypesMaster } from '@/hooks/useEmploymentTypesMaster';

interface EmploymentTypeComboboxProps {
  value: string;
  onChange: (value: string) => void;
  canEdit: boolean;
  onManageList: () => void;
  onRefresh?: () => void;
}

export function EmploymentTypeCombobox({
  value,
  onChange,
  canEdit,
  onManageList,
  onRefresh,
}: EmploymentTypeComboboxProps) {
  const [open, setOpen] = useState(false);
  const { employmentTypes, loading, refresh } = useEmploymentTypesMaster();

  useEffect(() => {
    if (onRefresh) {
      refresh();
    }
  }, [onRefresh]);

  // Filter active employment types for the dropdown list
  const activeEmploymentTypes = employmentTypes.filter((type) => type.status === 'Active');
  
  // Find selected employment type from full list (including inactive) so saved values display
  const selectedEmploymentType = employmentTypes.find((type) => type.id === value);

  const handleSelect = (employmentTypeId: string) => {
    onChange(employmentTypeId === value ? '' : employmentTypeId);
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
            placeholder={!selectedEmploymentType}
            aria-expanded={open}
            className="w-full justify-between"
            disabled={!canEdit}
          >
            {selectedEmploymentType ? (
              <span className="truncate">{selectedEmploymentType.name}</span>
            ) : (
              <span>Select employment type...</span>
            )}
            <ButtonArrow />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popper-anchor-width) p-0">
          <Command>
            <CommandInput placeholder="Search employment types..." />
            <CommandList>
              <ScrollArea viewportClassName="max-h-[300px] [&>div]:block!">
                <CommandEmpty>No employment type found.</CommandEmpty>
                <CommandGroup>
                  {loading ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      Loading employment types...
                    </div>
                  ) : (
                    activeEmploymentTypes.map((employmentType) => (
                      <CommandItem
                        key={employmentType.id}
                        value={employmentType.name}
                        onSelect={() => handleSelect(employmentType.id)}
                      >
                        <span className="truncate flex-1">{employmentType.name}</span>
                        {value === employmentType.id && <CommandCheck />}
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
        title="Manage employment type list"
      >
        <Settings className="size-4" />
      </Button>
    </div>
  );
}
