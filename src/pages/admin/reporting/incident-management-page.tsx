import { useState } from 'react';
import { Container } from '@/components/common/container';
import { Button } from '@/components/ui/button';
import { Plus, ShieldAlert, FileText, ArrowLeft } from 'lucide-react';
import { useRBAC, ACCESS_LEVEL } from '@/hooks/useRBAC';
import { RBAC_MODULES } from '@/config/rbac-modules';
import { IncidentList } from './components/incident-list';
import { IncidentForm } from './components/incident-form';
import { useCreateIncidentReport, useUpdateIncidentReport } from '@/hooks/use-incident-reports';
import { IncidentReport } from '@/models/incident-report';
import { toast } from 'sonner';
import { 
  Toolbar, 
  ToolbarHeading, 
  ToolbarPageTitle, 
  ToolbarDescription, 
  ToolbarActions 
} from '@/partials/common/toolbar';
import { useNavigate } from 'react-router';
import { ROUTES } from '@/config/routes.config';

type ViewMode = 'list' | 'form';

export function IncidentManagementPage() {
  const navigate = useNavigate();
  const { hasAccess } = useRBAC();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingIncident, setEditingIncident] = useState<IncidentReport | null>(null);

  const canReport = hasAccess({
    resource: RBAC_MODULES.REPORTING_CLINICAL,
    requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE,
  });

  const { mutateAsync: createIncident, isPending: isCreating } = useCreateIncidentReport();
  const { mutateAsync: updateIncident, isPending: isUpdating } = useUpdateIncidentReport();

  const handleEdit = (incident: IncidentReport) => {
    setEditingIncident(incident);
    setViewMode('form');
  };

  const handleAddNew = () => {
    setEditingIncident(null);
    setViewMode('form');
  };

  const handleSave = async (data: any) => {
    try {
      if (editingIncident) {
        await updateIncident({ id: editingIncident.id, ...data });
        toast.success('Incident report updated successfully');
      } else {
        await createIncident(data);
        toast.success('Incident report lodged successfully');
      }
      setViewMode('list');
      setEditingIncident(null);
    } catch (error: any) {
      console.error('Error saving incident:', error);
      toast.error('Failed to save incident report: ' + (error.message || 'Unknown error'));
    }
  };

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <div className="flex items-center gap-3">
              {viewMode === 'form' && (
                <Button variant="outline" size="sm" onClick={() => setViewMode('list')} disabled={isCreating || isUpdating}>
                  <ArrowLeft className="size-4 me-1.5" />
                  Back to List
                </Button>
              )}
              <div>
                <ToolbarPageTitle 
                  text={viewMode === 'list' ? 'Incident Management' : editingIncident ? 'Edit Incident Report' : 'Lodge Incident Report'} 
                />
                <ToolbarDescription>
                  {viewMode === 'list' 
                    ? 'Review, action, and manage all clinical and operational incidents.' 
                    : 'Provide comprehensive details for accurate clinical oversight and compliance.'
                  }
                </ToolbarDescription>
              </div>
            </div>
          </ToolbarHeading>
          <ToolbarActions>
            {viewMode === 'list' && (
              <>
                <Button variant="outline" onClick={() => navigate(ROUTES.REPORTING_CLINICAL_INCIDENTS)}>
                  <FileText className="size-4 me-2" />
                  Printable Reports
                </Button>
                {canReport && (
                  <Button variant="primary" onClick={handleAddNew}>
                    <Plus className="size-4 me-2" />
                    Lodge New Incident
                  </Button>
                )}
              </>
            )}
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container className="py-6">
        <div className="flex flex-col gap-6">
          {viewMode === 'list' ? (
            <div className="space-y-6">
              {/* Stats / Info Banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-4">
                <div className="size-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <ShieldAlert className="size-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-900 uppercase tracking-tight">Clinical Safety</h4>
                  <p className="text-xs text-amber-700/80 leading-relaxed mt-1 font-medium">
                    Accurate reporting is vital for NDIS compliance and ensuring the highest standard of care for our participants.
                  </p>
                </div>
              </div>

              <IncidentList onEdit={handleEdit} />
            </div>
          ) : (
            <IncidentForm 
              initialData={editingIncident || undefined} 
              onSave={handleSave} 
              onCancel={() => setViewMode('list')}
              isSaving={isCreating || isUpdating}
            />
          )}
        </div>
      </Container>
    </>
  );
}
