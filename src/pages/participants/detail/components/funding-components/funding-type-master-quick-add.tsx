import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FundingTypeMaster } from '@/models/funding-type-master';

const fundingTypeSchema = z.object({
  name: z.string().min(1, 'Funding type name is required'),
  is_active: z.boolean().default(true),
});

type FundingTypeFormValues = z.infer<typeof fundingTypeSchema>;

interface FundingTypeMasterQuickAddProps {
  open: boolean;
  onClose: () => void;
  onSave: (fundingType: Partial<FundingTypeMaster>) => Promise<void>;
  editingFundingType?: FundingTypeMaster | null;
}

export function FundingTypeMasterQuickAdd({
  open,
  onClose,
  onSave,
  editingFundingType,
}: FundingTypeMasterQuickAddProps) {
  const form = useForm<FundingTypeFormValues>({
    resolver: zodResolver(fundingTypeSchema),
    defaultValues: {
      name: '',
      is_active: true,
    },
  });

  useEffect(() => {
    if (open && editingFundingType) {
      form.reset({
        name: editingFundingType.name,
        is_active: editingFundingType.is_active,
      });
    } else if (open) {
      form.reset({
        name: '',
        is_active: true,
      });
    }
  }, [open, editingFundingType, form]);

  const handleSubmit = async (data: FundingTypeFormValues) => {
    await onSave({
      name: data.name,
      is_active: data.is_active,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent style={{ zIndex: 70 }}>
        <DialogHeader>
          <DialogTitle>
            {editingFundingType ? 'Edit Funding Type' : 'Add Funding Type to List'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Funding Type Name *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., SIL, ILO, Core" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
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
                {editingFundingType ? 'Update' : 'Add to List'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
