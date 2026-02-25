import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useStaff } from '@/hooks/useStaff';

interface StaffComboboxProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function StaffCombobox({ value, onChange, placeholder = "Select staff...", disabled = false }: StaffComboboxProps) {
  const [open, setOpen] = useState(false);
  const { staff, loading } = useStaff();

  const selectedStaff = staff.find(s => s.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedStaff ? selectedStaff.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search staff..." />
          <CommandEmpty>{loading ? "Loading..." : "No staff found."}</CommandEmpty>
          <CommandGroup>
            {staff.map((staffMember) => (
              <CommandItem
                key={staffMember.id}
                value={staffMember.id}
                onSelect={(currentValue) => {
                  onChange(currentValue === value ? "" : currentValue);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === staffMember.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex flex-col">
                  <span>{staffMember.name}</span>
                  {staffMember.email && (
                    <span className="text-xs text-muted-foreground">{staffMember.email}</span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
