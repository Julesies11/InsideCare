import { useEffect, useMemo } from 'react';
import { MedicationMaster } from '@/models/medication-master';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { getDisplayMedicationTypes } from '@/lib/medication-utils';
import { useMedicationTypes } from '@/hooks/use-medications-master';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

const medicationSchema = z.object({
  medication_name: z.string().min(1, 'Medication name is required'),
  brand_name: z.string().optional(),
  type_id: z.string().min(1, 'Medication type is required'),
  sub_class: z.string().optional(),
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
  const { data: medicationTypes = [] } = useMedicationTypes(true); // Fetch all for manual contextual filtering

  const displayTypes = useMemo(
    () =>
      getDisplayMedicationTypes(medicationTypes, editingMedication?.type_id),
    [medicationTypes, editingMedication],
  );

  const form = useForm<MedicationFormValues>({
    resolver: zodResolver(medicationSchema),
    defaultValues: {
      medication_name: '',
      brand_name: '',
      type_id: '',
      sub_class: '',
      side_effects: '',
      interactions: '',
      is_active: true,
    },
  });

  useEffect(() => {
    if (open && editingMedication) {
      form.reset({
        medication_name: editingMedication.medication_name,
        brand_name: editingMedication.brand_name || '',
        type_id: editingMedication.type_id || '',
        sub_class: editingMedication.sub_class || '',
        side_effects: editingMedication.side_effects || '',
        interactions: editingMedication.interactions || '',
        is_active: editingMedication.is_active,
      });
    } else if (open) {
      form.reset({
        medication_name: '',
        brand_name: '',
        type_id: '',
        sub_class: '',
        side_effects: '',
        interactions: '',
        is_active: true,
      });
    }
  }, [open, editingMedication, form]);

  const handleSubmit = async (data: MedicationFormValues) => {
    await onSave({
      medication_name: data.medication_name,
      brand_name: data.brand_name || null,
      type_id: data.type_id,
      sub_class: data.sub_class || null,
      side_effects: data.side_effects || null,
      interactions: data.interactions || null,
      is_active: data.is_active,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent style={{ zIndex: 70 }} className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editingMedication ? 'Edit Medication' : 'Add Medication to List'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4 py-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control as any}
                name="medication_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Generic Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Risperidone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control as any}
                name="brand_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand Name (AU)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Risperdal" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control as any}
                name="type_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medication Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {displayTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.medication_type_name}{' '}
                            {!type.is_active && '(Inactive)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control as any}
                name="sub_class"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sub Class</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Atypical" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control as any}
              name="side_effects"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Key Side Effects to Monitor</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="e.g., Drowsiness, dizziness, dry mouth, constipation"
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control as any}
              name="interactions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraindication/Interactions</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="e.g., MAO inhibitors, alcohol, other CNS depressants"
                      rows={2}
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
                {editingMedication ? 'Update' : 'Add to List'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
