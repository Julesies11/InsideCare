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
import { useFundingTypesMaster } from '@/hooks/useFundingTypesMaster';

interface FundingTypeComboboxProps {
  value: string;
  onChange: (value: string) => void;
  canEdit: boolean;
  onManageList: () => void;
  onRefresh?: () => void;
}

export function FundingTypeCombobox({
  value,
  onChange,
  canEdit,
  onManageList,
  onRefresh,
}: FundingTypeComboboxProps) {
  const [open, setOpen] = useState(false);
  const { fundingTypes, loading, refresh } = useFundingTypesMaster();

  useEffect(() => {
    if (onRefresh) {
      refresh();
    }
  }, [onRefresh]);

  const activeFundingTypes = fundingTypes.filter((ft) => ft.is_active);
  const selectedFundingType = fundingTypes.find((ft) => ft.id === value);

  const handleSelect = (fundingTypeId: string) => {
    onChange(fundingTypeId === value ? '' : fundingTypeId);
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
            placeholder={!selectedFundingType}
            aria-expanded={open}
            className="w-full justify-between"
            disabled={!canEdit}
          >
            {selectedFundingType ? (
              <span className="truncate">{selectedFundingType.name}</span>
            ) : (
              <span>Select funding type...</span>
            )}
            <ButtonArrow />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popper-anchor-width) p-0">
          <Command>
            <CommandInput placeholder="Search funding type..." />
            <CommandList>
              <ScrollArea viewportClassName="max-h-[300px] [&>div]:block!">
                <CommandEmpty>No funding type found.</CommandEmpty>
                <CommandGroup>
                  {loading ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      Loading funding types...
                    </div>
                  ) : (
                    activeFundingTypes.map((fundingType) => (
                      <CommandItem
                        key={fundingType.id}
                        value={fundingType.name}
                        onSelect={() => handleSelect(fundingType.id)}
                      >
                        <span className="truncate font-medium">{fundingType.name}</span>
                        {value === fundingType.id && <CommandCheck />}
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
        title="Manage funding types"
      >
        <Settings className="size-4" />
      </Button>
    </div>
  );
}
