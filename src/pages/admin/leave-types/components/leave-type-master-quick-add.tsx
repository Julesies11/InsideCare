import { useEffect } from 'react';
import { LeaveTypeMaster } from '@/models/leave-type-master';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

const leaveTypeSchema = z.object({
  leave_type_name: z.string().min(1, 'Leave type name is required'),
  is_active: z.boolean().default(true),
});

type LeaveTypeFormValues = z.infer<typeof leaveTypeSchema>;

interface LeaveTypeMasterQuickAddProps {
  open: boolean;
  onClose: () => void;
  onSave: (leaveType: Partial<LeaveTypeMaster>) => Promise<void>;
  editingLeaveType?: LeaveTypeMaster | null;
}

export function LeaveTypeMasterQuickAdd({
  open,
  onClose,
  onSave,
  editingLeaveType,
}: LeaveTypeMasterQuickAddProps) {
  const form = useForm<LeaveTypeFormValues>({
    resolver: zodResolver(leaveTypeSchema),
    defaultValues: {
      leave_type_name: '',
      is_active: true,
    },
  });

  useEffect(() => {
    if (open && editingLeaveType) {
      form.reset({
        leave_type_name: editingLeaveType.leave_type_name,
        is_active: editingLeaveType.is_active,
      });
    } else if (open) {
      form.reset({
        leave_type_name: '',
        is_active: true,
      });
    }
  }, [open, editingLeaveType, form]);

  const handleSubmit = async (data: LeaveTypeFormValues) => {
    await onSave({
      leave_type_name: data.leave_type_name,
      is_active: data.is_active,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent style={{ zIndex: 70 }}>
        <DialogHeader>
          <DialogTitle>
            {editingLeaveType ? 'Edit Leave Type' : 'Add Leave Type to List'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4 py-4"
          >
            <FormField
              control={form.control as any}
              name="leave_type_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Leave Type Name *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Annual Leave" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control as any}
              name="is_active"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel>Active</FormLabel>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                {editingLeaveType ? 'Update' : 'Add to List'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
