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
import { useContactTypesMaster } from '@/hooks/useContactTypesMaster';

interface ContactTypeComboboxProps {
  value: string;
  onChange: (value: string) => void;
  canEdit: boolean;
  onManageList: () => void;
  onRefresh?: () => void;
}

export function ContactTypeCombobox({
  value,
  onChange,
  canEdit,
  onManageList,
  onRefresh,
}: ContactTypeComboboxProps) {
  const [open, setOpen] = useState(false);
  const { contactTypes, loading, refresh } = useContactTypesMaster();

  useEffect(() => {
    if (onRefresh) {
      refresh();
    }
  }, [onRefresh]);

  const activeContactTypes = contactTypes.filter((ct) => ct.is_active);
  const selectedContactType = contactTypes.find((ct) => ct.name === value);

  const handleSelect = (contactTypeName: string) => {
    onChange(contactTypeName === value ? '' : contactTypeName);
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
            placeholder={!selectedContactType}
            aria-expanded={open}
            className="w-full justify-between"
            disabled={!canEdit}
          >
            {selectedContactType ? (
              <span className="truncate">{selectedContactType.name}</span>
            ) : value ? (
              <span className="truncate">{value}</span>
            ) : (
              <span>Select contact type...</span>
            )}
            <ButtonArrow />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popper-anchor-width) p-0">
          <Command>
            <CommandInput placeholder="Search contact type..." />
            <CommandList>
              <ScrollArea viewportClassName="max-h-[300px] [&>div]:block!">
                <CommandEmpty>No contact type found.</CommandEmpty>
                <CommandGroup>
                  {loading ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      Loading contact types...
                    </div>
                  ) : (
                    activeContactTypes.map((contactType) => (
                      <CommandItem
                        key={contactType.id}
                        value={contactType.name}
                        onSelect={handleSelect}
                      >
                        <span className="truncate font-medium">{contactType.name}</span>
                        {value === contactType.name && <CommandCheck />}
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
        title="Manage contact types"
      >
        <Settings className="size-4" />
      </Button>
    </div>
  );
}
