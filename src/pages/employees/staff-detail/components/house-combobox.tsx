import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActiveHouses } from '@/hooks/use-houses';
import { Button } from '@/components/ui/button';
import {
  Command,
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

interface HouseComboboxProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function HouseCombobox({
  value,
  onChange,
  placeholder = 'Select house...',
  disabled = false,
}: HouseComboboxProps) {
  const [open, setOpen] = useState(false);
  const { data: houses = [], isLoading: loading } = useActiveHouses();

  const selectedHouse = houses.find((h) => h.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-11"
          disabled={disabled}
        >
          {selectedHouse ? (
            <span className="font-bold">{selectedHouse.house_name}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Search house..." />
          <CommandEmpty>
            {loading ? 'Loading...' : 'No active houses found.'}
          </CommandEmpty>
          <CommandList className="max-h-[300px]">
            <CommandGroup>
              {houses.map((house) => (
                <CommandItem
                  key={house.id}
                  value={house.id}
                  onSelect={(currentValue) => {
                    onChange(currentValue);
                    setOpen(false);
                  }}
                  className="flex items-center justify-between py-3 cursor-pointer"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-gray-900">
                      {house.house_name}
                    </span>
                    {house.address && (
                      <span className="text-[10px] text-muted-foreground mt-0.5 max-w-[200px] truncate">
                        {house.address}
                      </span>
                    )}
                  </div>
                  <Check
                    className={cn(
                      'h-4 w-4 text-primary',
                      value === house.id ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
