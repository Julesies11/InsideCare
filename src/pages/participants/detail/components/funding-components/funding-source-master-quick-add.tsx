import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FundingSourceMaster } from '@/models/funding-source-master';

const fundingSourceSchema = z.object({
  name: z.string().min(1, 'Funding source name is required'),
  is_active: z.boolean().default(true),
});

type FundingSourceFormValues = z.infer<typeof fundingSourceSchema>;

interface FundingSourceMasterQuickAddProps {
  open: boolean;
  onClose: () => void;
  onSave: (fundingSource: Partial<FundingSourceMaster>) => Promise<void>;
  editingFundingSource?: FundingSourceMaster | null;
}

export function FundingSourceMasterQuickAdd({
  open,
  onClose,
  onSave,
  editingFundingSource,
}: FundingSourceMasterQuickAddProps) {
  const form = useForm<FundingSourceFormValues>({
    resolver: zodResolver(fundingSourceSchema),
    defaultValues: {
      name: '',
      is_active: true,
    },
  });

  useEffect(() => {
    if (open && editingFundingSource) {
      form.reset({
        name: editingFundingSource.name,
        is_active: editingFundingSource.is_active,
      });
    } else if (open) {
      form.reset({
        name: '',
        is_active: true,
      });
    }
  }, [open, editingFundingSource, form]);

  const handleSubmit = async (data: FundingSourceFormValues) => {
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
            {editingFundingSource ? 'Edit Funding Source' : 'Add Funding Source to List'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Funding Source Name *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., NDIS, Plan" />
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
                {editingFundingSource ? 'Update' : 'Add to List'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
