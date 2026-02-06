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
import { useFundingSourcesMaster } from '@/hooks/useFundingSourcesMaster';

interface FundingSourceComboboxProps {
  value: string;
  onChange: (value: string) => void;
  canEdit: boolean;
  onManageList: () => void;
  onRefresh?: () => void;
}

export function FundingSourceCombobox({
  value,
  onChange,
  canEdit,
  onManageList,
  onRefresh,
}: FundingSourceComboboxProps) {
  const [open, setOpen] = useState(false);
  const { fundingSources, loading, refresh } = useFundingSourcesMaster();

  useEffect(() => {
    if (onRefresh) {
      refresh();
    }
  }, [onRefresh]);

  const activeFundingSources = fundingSources.filter((fs) => fs.is_active);
  const selectedFundingSource = fundingSources.find((fs) => fs.id === value);

  const handleSelect = (fundingSourceId: string) => {
    onChange(fundingSourceId === value ? '' : fundingSourceId);
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
            placeholder={!selectedFundingSource}
            aria-expanded={open}
            className="w-full justify-between"
            disabled={!canEdit}
          >
            {selectedFundingSource ? (
              <span className="truncate">{selectedFundingSource.name}</span>
            ) : value ? (
              <span className="truncate">{value}</span>
            ) : (
              <span>Select funding source...</span>
            )}
            <ButtonArrow />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popper-anchor-width) p-0">
          <Command>
            <CommandInput placeholder="Search funding source..." />
            <CommandList>
              <ScrollArea viewportClassName="max-h-[300px] [&>div]:block!">
                <CommandEmpty>No funding source found.</CommandEmpty>
                <CommandGroup>
                  {loading ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      Loading funding sources...
                    </div>
                  ) : (
                    activeFundingSources.map((fundingSource) => (
                      <CommandItem
                        key={fundingSource.id}
                        value={fundingSource.id}
                        onSelect={handleSelect}
                      >
                        <span className="truncate font-medium">{fundingSource.name}</span>
                        {value === fundingSource.id && <CommandCheck />}
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
        title="Manage funding sources"
      >
        <Settings className="size-4" />
      </Button>
    </div>
  );
}
