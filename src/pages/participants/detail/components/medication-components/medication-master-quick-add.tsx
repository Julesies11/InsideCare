import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { MedicationMaster } from '@/models/medication-master';

const medicationSchema = z.object({
  name: z.string().min(1, 'Medication name is required'),
  category: z.string().optional(),
  common_dosages: z.string().optional(),
  side_effects: z.string().optional(),
  interactions: z.string().optional(),
  is_active: z.boolean().default(true),
});

type MedicationFormValues = z.infer<typeof medicationSchema>;

interface MedicationMasterQuickAddProps {
  open: boolean;
  onClose: () => void;
  onSave: (medication: Partial<MedicationMaster>) => Promise<void>;
  editingMedication?: MedicationMaster | null;
}

export function MedicationMasterQuickAdd({
  open,
  onClose,
  onSave,
  editingMedication,
}: MedicationMasterQuickAddProps) {
  const form = useForm<MedicationFormValues>({
    resolver: zodResolver(medicationSchema),
    defaultValues: {
      name: '',
      category: '',
      common_dosages: '',
      side_effects: '',
      interactions: '',
      is_active: true,
    },
  });

  useEffect(() => {
    if (open && editingMedication) {
      form.reset({
        name: editingMedication.name,
        category: editingMedication.category || '',
        common_dosages: editingMedication.common_dosages || '',
        side_effects: editingMedication.side_effects || '',
        interactions: editingMedication.interactions || '',
        is_active: editingMedication.is_active,
      });
    } else if (open) {
      form.reset({
        name: '',
        category: '',
        common_dosages: '',
        side_effects: '',
        interactions: '',
        is_active: true,
      });
    }
  }, [open, editingMedication, form]);

  const handleSubmit = async (data: MedicationFormValues) => {
    await onSave({
      name: data.name,
      category: data.category || null,
      common_dosages: data.common_dosages || null,
      side_effects: data.side_effects || null,
      interactions: data.interactions || null,
      is_active: data.is_active,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent style={{ zIndex: 70 }}>
        <DialogHeader>
          <DialogTitle>
            {editingMedication ? 'Edit Medication' : 'Add Medication to List'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medication Name *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Risperidone" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Antipsychotic, Pain, etc." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="common_dosages"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Common Dosages</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., 0.5mg, 1mg, 2mg, 3mg, 4mg"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="side_effects"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>General Side Effects</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="e.g., Drowsiness, dizziness, dry mouth, constipation"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="interactions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraindication/Interactions</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="e.g., MAO inhibitors, alcohol, other CNS depressants"
                      rows={3}
                    />
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
                {editingMedication ? 'Update' : 'Add to List'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
