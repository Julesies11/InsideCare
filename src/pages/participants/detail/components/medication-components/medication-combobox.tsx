import { useState } from 'react';
import { useMedicationsMaster } from '@/hooks/use-medications-master';
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

interface MedicationComboboxProps {
  value: string;
  onChange: (value: string) => void;
  canEdit: boolean;
}

export function MedicationCombobox({
  value,
  onChange,
  canEdit,
}: MedicationComboboxProps) {
  const [open, setOpen] = useState(false);
  const { medications = [], isLoading: loading } = useMedicationsMaster(
    0,
    1000,
  );

  const activeMedications = medications.filter(
    (med) => med.is_active || med.id === value,
  );
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
              <span className="truncate">
                {selectedMedication.medication_name}
              </span>
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
                        value={`${medication.medication_name} ${medication.brand_name || ''}`}
                        onSelect={() => handleSelect(medication.id)}
                      >
                        <span className="flex flex-col gap-0.5 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate font-medium">
                              {medication.medication_name}
                            </span>
                            {medication.brand_name && (
                              <span className="text-xs text-muted-foreground">
                                ({medication.brand_name})
                              </span>
                            )}
                          </span>
                          {(medication as any).medication_type
                            ?.medication_type_name && (
                            <span className="text-[10px] text-muted-foreground uppercase font-medium">
                              {
                                (medication as any).medication_type
                                  .medication_type_name
                              }
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
    </div>
  );
}
