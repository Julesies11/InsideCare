import { Container } from '@/components/common/container';
import { Button } from '@/components/ui/button';
import { Plus, ShieldAlert, ArrowLeft, Printer, Loader2 } from 'lucide-react';
import { useRBAC, ACCESS_LEVEL } from '@/hooks/useRBAC';
import { RBAC_MODULES } from '@/config/rbac-modules';
import { IncidentList } from './components/incident-list';
import { IncidentForm } from './components/incident-form';
import { IncidentSingleReport } from './components/incident-single-report';
import { useCreateIncidentReport, useUpdateIncidentReport, useIncidentReport } from '@/hooks/use-incident-reports';
import { IncidentReport } from '@/models/incident-report';
import { toast } from 'sonner';
import { 
  Toolbar, 
  ToolbarHeading, 
  ToolbarPageTitle, 
  ToolbarDescription, 
  ToolbarActions 
} from '@/partials/common/toolbar';
import { useSearchParams } from 'react-router';

type ViewMode = 'list' | 'form' | 'print-single';

export function IncidentManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasAccess } = useRBAC();

  const incidentId = searchParams.get('id') || undefined;
  const mode = searchParams.get('mode');
  const isPrintSingle = searchParams.get('print') === 'true';

  // Fetch single incident if ID is present in URL
  const { data: loadedIncident, isLoading: isLoadingIncident } = useIncidentReport(incidentId);

  const viewMode: ViewMode = mode === 'new' 
    ? 'form' 
    : incidentId 
      ? (isPrintSingle ? 'print-single' : 'form') 
      : 'list';

  const editingIncident = incidentId ? loadedIncident || null : null;

  const canReport = hasAccess({
    resource: RBAC_MODULES.REPORTING_CLINICAL,
    requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE,
  });

  const { mutateAsync: createIncident, isPending: isCreating } = useCreateIncidentReport();
  const { mutateAsync: updateIncident, isPending: isUpdating } = useUpdateIncidentReport();

  const handleEdit = (incident: IncidentReport) => {
    setSearchParams({ id: incident.id }, { replace: true });
  };

  const handleAddNew = () => {
    setSearchParams({ mode: 'new' }, { replace: true });
  };

  const handleBackToList = () => {
    setSearchParams({}, { replace: true });
  };

  const handleBackToEdit = () => {
    if (incidentId) {
      setSearchParams({ id: incidentId }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const handlePrintPreview = () => {
    if (incidentId) {
      setSearchParams({ id: incidentId, print: 'true' }, { replace: true });
    }
  };

  const handleSave = async (data: any) => {
    try {
      if (incidentId) {
        await updateIncident({ id: incidentId, ...data });
        toast.success('Incident report updated successfully');
      } else {
        await createIncident(data);
        toast.success('Incident report lodged successfully');
      }
      setSearchParams({}, { replace: true });
    } catch (error: any) {
      console.error('Error saving incident:', error);
      toast.error('Failed to save incident report: ' + (error.message || 'Unknown error'));
    }
  };

  if (incidentId && isLoadingIncident) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-gray-500">Loading incident details...</p>
      </div>
    );
  }

  if (incidentId && !isLoadingIncident && !loadedIncident) {
    return (
      <Container className="py-20 text-center space-y-4">
        <ShieldAlert className="size-12 text-destructive mx-auto" />
        <h3 className="text-lg font-bold text-gray-900">Incident Not Found</h3>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          The incident report you are looking for does not exist or you do not have permission to view it.
        </p>
        <Button variant="primary" onClick={handleBackToList}>
          Back to Incident Log
        </Button>
      </Container>
    );
  }

  return (
    <>
      <div className="no-print">
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <div className="flex items-center gap-3">
                {viewMode === 'form' && (
                  <Button variant="outline" size="sm" onClick={handleBackToList} disabled={isCreating || isUpdating}>
                    <ArrowLeft className="size-4 me-1.5" />
                    Back to List
                  </Button>
                )}
                {viewMode === 'print-single' && (
                  <Button variant="outline" size="sm" onClick={handleBackToEdit}>
                    <ArrowLeft className="size-4 me-1.5" />
                    Back to Edit
                  </Button>
                )}
                <div>
                  <ToolbarPageTitle 
                    text={
                      viewMode === 'list' 
                        ? 'Incident Management' 
                        : viewMode === 'print-single' 
                          ? `Print Incident Details${editingIncident?.reference_id ? ` · ${editingIncident.reference_id}` : ''}` 
                          : editingIncident 
                            ? `Edit Incident Report${editingIncident.reference_id ? ` · ${editingIncident.reference_id}` : ''}` 
                            : 'Lodge Incident Report'
                    } 
                  />
                  <ToolbarDescription>
                    {viewMode === 'list' 
                      ? 'Review, action, and manage all clinical and operational incidents.' 
                      : viewMode === 'print-single'
                        ? `Print view for ${editingIncident?.reference_id || 'incident report'}.`
                        : 'Provide comprehensive details for accurate clinical oversight and compliance.'
                    }
                  </ToolbarDescription>
                </div>
              </div>
            </ToolbarHeading>
            <ToolbarActions>
              {viewMode === 'list' && (
                <>
                  {canReport && (
                    <Button variant="primary" onClick={handleAddNew}>
                      <Plus className="size-4 me-2" />
                      Lodge New Incident
                    </Button>
                  )}
                </>
              )}
              {viewMode === 'form' && editingIncident && (
                <Button variant="outline" onClick={handlePrintPreview}>
                  <Printer className="size-4 me-2" />
                  Print Preview
                </Button>
              )}
              {viewMode === 'print-single' && (
                <Button variant="primary" onClick={() => window.print()}>
                  <Printer className="size-4 me-2" />
                  Print Report
                </Button>
              )}
            </ToolbarActions>
          </Toolbar>
        </Container>
      </div>

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
          ) : viewMode === 'form' ? (
            <IncidentForm 
              initialData={editingIncident || undefined} 
              onSave={handleSave} 
              onCancel={handleBackToList}
              isSaving={isCreating || isUpdating}
            />
          ) : (
            editingIncident && (
              <IncidentSingleReport incident={editingIncident as any} />
            )
          )}
        </div>
      </Container>
    </>
  );
}
