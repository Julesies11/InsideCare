import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useStaff } from '@/hooks/use-staff';

interface StaffComboboxProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function StaffCombobox({ value, onChange, placeholder = "Select staff...", disabled = false }: StaffComboboxProps) {
  const [open, setOpen] = useState(false);
  const { staff, loading } = useStaff(0, 1000, [], { statuses: ['active'] });

  const selectedStaff = staff.find(s => s.id === value);

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
          {selectedStaff ? (
            <div className="flex items-center gap-2">
              <Avatar className="size-6">
                <AvatarImage src={selectedStaff.photo_url || undefined} />
                <AvatarFallback className="text-[10px]">{selectedStaff.name?.substring(0, 2).toUpperCase() ?? '?'}</AvatarFallback>
              </Avatar>
              <span className="font-bold">{selectedStaff.name}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search staff..." />
          <CommandEmpty>{loading ? "Loading..." : "No active staff found."}</CommandEmpty>
          <CommandList className="max-h-[300px]">
            <CommandGroup>
              {staff.map((staffMember) => (
                <CommandItem
                  key={staffMember.id}
                  value={staffMember.id}
                  onSelect={(currentValue) => {
                    onChange(currentValue);
                    setOpen(false);
                  }}
                  className="flex items-center gap-3 py-3"
                >
                  <div className="flex items-center flex-1 gap-3">
                    <Avatar className="size-8">
                      <AvatarImage src={staffMember.photo_url || undefined} />
                      <AvatarFallback>{staffMember.name?.substring(0, 2).toUpperCase() ?? '?'}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-gray-900">{staffMember.name}</span>
                      <span className="text-[10px] text-primary font-black uppercase tracking-widest leading-none mt-0.5">
                        {staffMember.role?.name || 'No Role'}
                      </span>
                    </div>
                  </div>
                  <Check
                    className={cn(
                      "h-4 w-4 text-primary",
                      value === staffMember.id ? "opacity-100" : "opacity-0"
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
