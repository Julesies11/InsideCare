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
import { useDepartmentsMaster } from '@/hooks/useDepartmentsMaster';

interface DepartmentComboboxProps {
  value: string;
  onChange: (value: string) => void;
  canEdit: boolean;
  onManageList: () => void;
  onRefresh?: () => void;
}

export function DepartmentCombobox({
  value,
  onChange,
  canEdit,
  onManageList,
  onRefresh,
}: DepartmentComboboxProps) {
  const [open, setOpen] = useState(false);
  const { departments, loading, refresh } = useDepartmentsMaster();

  useEffect(() => {
    if (onRefresh) {
      refresh();
    }
  }, [onRefresh]);

  // Filter active departments for the dropdown list
  const activeDepartments = departments.filter((dept) => dept.status === 'Active');
  
  // Find selected department from full list (including inactive) so saved values display
  const selectedDepartment = departments.find((dept) => dept.id === value);

  const handleSelect = (departmentId: string) => {
    onChange(departmentId === value ? '' : departmentId);
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
            placeholder={!selectedDepartment}
            aria-expanded={open}
            className="w-full justify-between"
            disabled={!canEdit}
          >
            {selectedDepartment ? (
              <span className="truncate">{selectedDepartment.name}</span>
            ) : (
              <span>Select department...</span>
            )}
            <ButtonArrow />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popper-anchor-width) p-0">
          <Command>
            <CommandInput placeholder="Search departments..." />
            <CommandList>
              <ScrollArea viewportClassName="max-h-[300px] [&>div]:block!">
                <CommandEmpty>No department found.</CommandEmpty>
                <CommandGroup>
                  {loading ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      Loading departments...
                    </div>
                  ) : (
                    activeDepartments.map((department) => (
                      <CommandItem
                        key={department.id}
                        value={department.name}
                        onSelect={() => handleSelect(department.id)}
                      >
                        <span className="truncate flex-1">{department.name}</span>
                        {value === department.id && <CommandCheck />}
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
        title="Manage department list"
      >
        <Settings className="size-4" />
      </Button>
    </div>
  );
}
