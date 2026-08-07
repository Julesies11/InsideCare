import { useEffect } from 'react';
import { ContactTypeMaster } from '@/models/contact-type-master';
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

const contactTypeSchema = z.object({
  contact_type_name: z.string().min(1, 'Contact type name is required'),
  is_active: z.boolean().default(true),
});

type ContactTypeFormValues = z.infer<typeof contactTypeSchema>;

interface ContactTypeMasterQuickAddProps {
  open: boolean;
  onClose: () => void;
  onSave: (contactType: Partial<ContactTypeMaster>) => Promise<void>;
  editingContactType?: ContactTypeMaster | null;
}

export function ContactTypeMasterQuickAdd({
  open,
  onClose,
  onSave,
  editingContactType,
}: ContactTypeMasterQuickAddProps) {
  const form = useForm<ContactTypeFormValues>({
    resolver: zodResolver(contactTypeSchema),
    defaultValues: {
      contact_type_name: '',
      is_active: true,
    },
  });

  useEffect(() => {
    if (open && editingContactType) {
      form.reset({
        contact_type_name: editingContactType.contact_type_name,
        is_active: editingContactType.is_active,
      });
    } else if (open) {
      form.reset({
        contact_type_name: '',
        is_active: true,
      });
    }
  }, [open, editingContactType, form]);

  const handleSubmit = async (data: ContactTypeFormValues) => {
    await onSave({
      contact_type_name: data.contact_type_name,
      is_active: data.is_active,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent style={{ zIndex: 70 }}>
        <DialogHeader>
          <DialogTitle>
            {editingContactType
              ? 'Edit Contact Type'
              : 'Add Contact Type to List'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4 py-4"
          >
            <FormField
              control={form.control as any}
              name="contact_type_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Type Name *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Service Providers, Guardian"
                    />
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
                {editingContactType ? 'Update' : 'Add to List'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
