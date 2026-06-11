import { useEffect, useMemo, useState } from 'react';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/partials/common/toolbar';
import { ArrowLeft, Loader2, Save, Settings2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { RBAC_MODULES } from '@/config/rbac-modules';
import { ROUTES } from '@/config/routes.config';
import { getDisplayMedicationTypes } from '@/lib/medication-utils';
import {
  useAddMedicationMaster,
  useMedicationMaster,
  useMedicationTypes,
  useUpdateMedicationMaster,
} from '@/hooks/use-medications-master';
import { ACCESS_LEVEL, useRBAC } from '@/hooks/useRBAC';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Container } from '@/components/common/container';
import { MedicationTypeMasterDialog } from './components/medication-type-master-dialog';

export function MedicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const { hasAccess } = useRBAC();

  const { data: medication, isLoading: loading } = useMedicationMaster(id);
  const { data: medicationTypes = [] } = useMedicationTypes(true); // Fetch all for manual contextual filtering
  const { mutateAsync: addMedication } = useAddMedicationMaster();
  const { mutateAsync: updateMedication } = useUpdateMedicationMaster();

  const displayTypes = useMemo(
    () => getDisplayMedicationTypes(medicationTypes, medication?.type_id),
    [medicationTypes, medication],
  );

  const [formData, setFormData] = useState({
    medication_name: '',
    brand_name: '',
    type_id: '',
    sub_class: '',
    purpose: '',
    contraindications: '',
    side_effects: '',
    interactions: '',
    is_active: true,
  });

  const [initialData, setInitialData] = useState(formData);
  const [saving, setSaving] = useState(false);
  const [typeMasterOpen, setTypeMasterOpen] = useState(false);

  const isDirty = JSON.stringify(formData) !== JSON.stringify(initialData);

  const canEdit = hasAccess({
    resource: RBAC_MODULES.MASTER_LISTS,
    requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE,
  });

  const canManageTypes = hasAccess({
    resource: RBAC_MODULES.ACCESS_CONTROL,
    requiredLevel: ACCESS_LEVEL.FULL,
  });

  useEffect(() => {
    if (medication && !isNew) {
      const data = {
        medication_name: medication.medication_name || '',
        brand_name: medication.brand_name || '',
        type_id: medication.type_id || '',
        sub_class: medication.sub_class || '',
        purpose: medication.purpose || '',
        contraindications: medication.contraindications || '',
        side_effects: medication.side_effects || '',
        interactions: medication.interactions || '',
        is_active: medication.is_active ?? true,
      };
      setFormData(data);
      setInitialData(data);
    }
  }, [medication, isNew]);

  const handleSave = async () => {
    if (!formData.medication_name.trim()) {
      toast.error('Medication name is required');
      return;
    }

    if (!formData.type_id) {
      toast.error('Medication type is required');
      return;
    }

    setSaving(true);
    try {
      if (isNew) {
        await addMedication(formData);
        toast.success('Medication added to register');
      } else if (id) {
        await updateMedication({
          id,
          updates: formData,
          oldMedication: medication!,
        });
        toast.success('Medication updated successfully');
      }
      navigate(ROUTES.MEDICATION_REGISTER);
    } catch (error) {
      const err = error as Error;
      if (err.message === 'DUPLICATE_NAME') {
        toast.error('A medication with this name already exists');
      } else {
        toast.error('Failed to save medication: ' + err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading && !isNew) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Toolbar>
        <Container>
          <div className="flex items-center justify-between gap-5">
            <ToolbarHeading>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(ROUTES.MEDICATION_REGISTER)}
                >
                  <ArrowLeft className="size-4 me-1.5" />
                  Back
                </Button>
                <div>
                  <ToolbarPageTitle
                    text={isNew ? 'Add Medication' : formData.medication_name}
                  />
                  <ToolbarDescription>
                    {isNew
                      ? 'Create a new entry in the medication register'
                      : 'Manage medication details and instructions'}
                  </ToolbarDescription>
                </div>
              </div>
            </ToolbarHeading>
            <ToolbarActions>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving || !canEdit || (!isNew && !isDirty)}
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin me-1.5" />
                ) : (
                  <Save className="size-4 me-1.5" />
                )}
                {isNew ? 'Create Medication' : 'Save Changes'}
              </Button>
            </ToolbarActions>
          </div>
        </Container>
      </Toolbar>

      <Container className="py-6 lg:py-10">
        <div className="grid gap-5 lg:gap-7.5 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Medication Information</CardTitle>
              <CardDescription>
                Primary details and categorization of the medication.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="medication_name">
                    Generic Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="medication_name"
                    value={formData.medication_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        medication_name: e.target.value,
                      })
                    }
                    placeholder="e.g., Risperidone"
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand_name">Brand Name (AU)</Label>
                  <Input
                    id="brand_name"
                    value={formData.brand_name}
                    onChange={(e) =>
                      setFormData({ ...formData, brand_name: e.target.value })
                    }
                    placeholder="e.g., Risperdal"
                    disabled={!canEdit}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="type_id">
                      Medication Type{' '}
                      <span className="text-destructive">*</span>
                    </Label>
                    {canManageTypes && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setTypeMasterOpen(true)}
                        className="h-auto p-0 text-xs font-medium text-primary hover:bg-transparent hover:text-primary/80"
                      >
                        <Settings2 className="size-3 me-1.5" />
                        Manage Types
                      </Button>
                    )}
                  </div>
                  <Select
                    value={formData.type_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type_id: value })
                    }
                    disabled={!canEdit}
                  >
                    <SelectTrigger id="type_id">
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {displayTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.medication_type_name}{' '}
                          {!type.is_active && '(Inactive)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sub_class">Sub Class</Label>
                  <Input
                    id="sub_class"
                    value={formData.sub_class}
                    onChange={(e) =>
                      setFormData({ ...formData, sub_class: e.target.value })
                    }
                    placeholder="e.g., Atypical"
                    disabled={!canEdit}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Active Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Inactive medications are hidden from selection in
                    participant profiles.
                  </p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                  disabled={!canEdit}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Clinical Guidance</CardTitle>
              <CardDescription>
                Safety information and usage instructions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose (Indications)</Label>
                <Textarea
                  id="purpose"
                  value={formData.purpose}
                  onChange={(e) =>
                    setFormData({ ...formData, purpose: e.target.value })
                  }
                  placeholder="What this medication is for..."
                  rows={3}
                  disabled={!canEdit}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="side_effects">
                  Key Side Effects to Monitor
                </Label>
                <Textarea
                  id="side_effects"
                  value={formData.side_effects}
                  onChange={(e) =>
                    setFormData({ ...formData, side_effects: e.target.value })
                  }
                  placeholder="List common side effects staff should monitor for..."
                  rows={3}
                  disabled={!canEdit}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contraindications">Contraindications</Label>
                <Textarea
                  id="contraindications"
                  value={formData.contraindications}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contraindications: e.target.value,
                    })
                  }
                  placeholder="List any reasons why this medication should not be used..."
                  rows={3}
                  disabled={!canEdit}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="interactions">
                  Never Combine With (Interactions)
                </Label>
                <Textarea
                  id="interactions"
                  value={formData.interactions}
                  onChange={(e) =>
                    setFormData({ ...formData, interactions: e.target.value })
                  }
                  placeholder="List any known drug interactions..."
                  rows={3}
                  disabled={!canEdit}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
      <MedicationTypeMasterDialog
        open={typeMasterOpen}
        onClose={() => setTypeMasterOpen(false)}
        canEdit={canManageTypes}
      />
    </>
  );
}
