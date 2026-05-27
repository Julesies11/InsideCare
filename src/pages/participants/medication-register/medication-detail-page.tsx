import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Container } from '@/components/common/container';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Loader2, Trash2 } from 'lucide-react';
import { 
  useMedicationMaster, 
  useAddMedicationMaster, 
  useUpdateMedicationMaster,
  useDeleteMedicationMaster
} from '@/hooks/use-medications-master';
import { toast } from 'sonner';
import { Toolbar, ToolbarActions, ToolbarHeading, ToolbarPageTitle, ToolbarDescription } from '@/partials/common/toolbar';
import { RBAC_MODULES } from '@/config/rbac-modules';
import { useRBAC, ACCESS_LEVEL } from '@/hooks/useRBAC';

export function MedicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const { hasAccess } = useRBAC();

  const { data: medication, isLoading: loading } = useMedicationMaster(id);
  const { mutateAsync: addMedication } = useAddMedicationMaster();
  const { mutateAsync: updateMedication } = useUpdateMedicationMaster();
  const { mutateAsync: deleteMedication } = useDeleteMedicationMaster();

  const [formData, setFormData] = useState({
    medication_name: '',
    category: '',
    common_dosages: '',
    side_effects: '',
    interactions: '',
    is_active: true,
  });

  const [saving, setSaving] = useState(false);

  const canEdit = hasAccess({
    resource: RBAC_MODULES.MASTER_LISTS,
    requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE,
  });

  useEffect(() => {
    if (medication && !isNew) {
      setFormData({
        medication_name: medication.medication_name || '',
        category: medication.category || '',
        common_dosages: medication.common_dosages || '',
        side_effects: medication.side_effects || '',
        interactions: medication.interactions || '',
        is_active: medication.is_active ?? true,
      });
    }
  }, [medication, isNew]);

  const handleSave = async () => {
    if (!formData.medication_name.trim()) {
      toast.error('Medication name is required');
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
          oldMedication: medication! 
        });
        toast.success('Medication updated successfully');
      }
      navigate('/participants/medication-register');
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

  const handleDelete = async () => {
    if (isNew || !id || !medication) return;
    
    if (window.confirm('Are you sure you want to deactivate this medication? It will no longer be available for selection.')) {
      try {
        await deleteMedication({ id, medication_name: medication.medication_name });
        toast.success('Medication deactivated');
        navigate('/participants/medication-register');
      } catch (error) {
        toast.error('Failed to deactivate medication');
      }
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
                  onClick={() => navigate('/participants/medication-register')}
                >
                  <ArrowLeft className="size-4 me-1.5" />
                  Back
                </Button>
                <div>
                  <ToolbarPageTitle text={isNew ? 'Add Medication' : formData.medication_name} />
                  <ToolbarDescription>
                    {isNew ? 'Create a new entry in the medication register' : 'Manage medication details and instructions'}
                  </ToolbarDescription>
                </div>
              </div>
            </ToolbarHeading>
            <ToolbarActions>
              {!isNew && canEdit && (
                <Button variant="outline" size="sm" onClick={handleDelete} className="text-destructive hover:bg-destructive/5">
                  <Trash2 className="size-4 me-1.5" />
                  Deactivate
                </Button>
              )}
              <Button size="sm" onClick={handleSave} disabled={saving || !canEdit}>
                {saving ? <Loader2 className="size-4 animate-spin me-1.5" /> : <Save className="size-4 me-1.5" />}
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
              <CardDescription>Primary details and categorization of the medication.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="medication_name">Medication Name <span className="text-destructive">*</span></Label>
                  <Input
                    id="medication_name"
                    value={formData.medication_name}
                    onChange={(e) => setFormData({ ...formData, medication_name: e.target.value })}
                    placeholder="e.g., Paracetamol"
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Analgesic, Antibiotic"
                    disabled={!canEdit}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="common_dosages">Common Dosages</Label>
                <Input
                  id="common_dosages"
                  value={formData.common_dosages}
                  onChange={(e) => setFormData({ ...formData, common_dosages: e.target.value })}
                  placeholder="e.g., 500mg, 10mg/ml"
                  disabled={!canEdit}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Active Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Inactive medications are hidden from selection in participant profiles.
                  </p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  disabled={!canEdit}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Clinical Guidance</CardTitle>
              <CardDescription>Safety information and usage instructions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="side_effects">General Side Effects</Label>
                <Textarea
                  id="side_effects"
                  value={formData.side_effects}
                  onChange={(e) => setFormData({ ...formData, side_effects: e.target.value })}
                  placeholder="List common side effects staff should monitor for..."
                  rows={4}
                  disabled={!canEdit}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="interactions">Contraindication/Interactions</Label>
                <Textarea
                  id="interactions"
                  value={formData.interactions}
                  onChange={(e) => setFormData({ ...formData, interactions: e.target.value })}
                  placeholder="List any known drug interactions or contraindications..."
                  rows={4}
                  disabled={!canEdit}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
    </>
  );
}
