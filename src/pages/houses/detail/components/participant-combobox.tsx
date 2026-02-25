import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useParticipants } from '@/hooks/use-participants';

interface ParticipantComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ParticipantCombobox({ 
  value, 
  onChange, 
  placeholder = "Select a participant...",
  disabled = false 
}: ParticipantComboboxProps) {
  const [open, setOpen] = useState(false);
  const { participants, loading } = useParticipants();

  const selectedParticipant = participants.find(p => p.id === value);

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
          {selectedParticipant ? selectedParticipant.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search participants..." />
          <CommandEmpty>{loading ? "Loading..." : "No participants found."}</CommandEmpty>
          <CommandGroup>
            {participants.map((participant) => (
              <CommandItem
                key={participant.id}
                value={participant.id}
                onSelect={(currentValue) => {
                  onChange(currentValue === value ? "" : currentValue);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === participant.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {participant.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
