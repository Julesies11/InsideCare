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
import { useMedicationsMaster } from '@/hooks/useMedicationsMaster';

interface MedicationComboboxProps {
  value: string;
  onChange: (value: string) => void;
  canEdit: boolean;
  onManageList: () => void;
  onRefresh?: () => void;
}

export function MedicationCombobox({
  value,
  onChange,
  canEdit,
  onManageList,
  onRefresh,
}: MedicationComboboxProps) {
  const [open, setOpen] = useState(false);
  const { medications, loading, refresh } = useMedicationsMaster();

  useEffect(() => {
    if (onRefresh) {
      refresh();
    }
  }, [onRefresh]);

  const activeMedications = medications.filter((med) => med.is_active);
  const selectedMedication = medications.find((med) => med.id === value);

  const handleSelect = (medicationId: string) => {
    onChange(medicationId === value ? '' : medicationId);
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
            placeholder={!selectedMedication}
            aria-expanded={open}
            className="w-full justify-between"
            disabled={!canEdit}
          >
            {selectedMedication ? (
              <span className="truncate">{selectedMedication.name}</span>
            ) : (
              <span>Select medication...</span>
            )}
            <ButtonArrow />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popper-anchor-width) p-0">
          <Command>
            <CommandInput placeholder="Search medication..." />
            <CommandList>
              <ScrollArea viewportClassName="max-h-[300px] [&>div]:block!">
                <CommandEmpty>No medication found.</CommandEmpty>
                <CommandGroup>
                  {loading ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      Loading medications...
                    </div>
                  ) : (
                    activeMedications.map((medication) => (
                      <CommandItem
                        key={medication.id}
                        value={medication.name}
                        onSelect={() => handleSelect(medication.id)}
                      >
                        <span className="flex flex-col gap-0.5 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate font-medium">{medication.name}</span>
                            {medication.category && (
                              <span className="text-xs text-muted-foreground">
                                ({medication.category})
                              </span>
                            )}
                          </span>
                          {medication.common_dosages && (
                            <span className="text-xs text-muted-foreground">
                              {medication.common_dosages}
                            </span>
                          )}
                        </span>
                        {value === medication.id && <CommandCheck />}
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
        title="Manage medication list"
      >
        <Settings className="size-4" />
      </Button>
    </div>
  );
}
