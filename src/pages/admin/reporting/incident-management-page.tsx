import { useEffect } from 'react';
import { IncidentReport } from '@/models/incident-report';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/partials/common/toolbar';
import {
  ArrowLeft,
  FileSearch,
  Loader2,
  Plus,
  Printer,
  ShieldAlert,
} from 'lucide-react';
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router';
import { toast } from 'sonner';
import { RBAC_MODULES } from '@/config/rbac-modules';
import {
  useCreateIncidentReport,
  useIncidentReport,
  useUpdateIncidentReport,
} from '@/hooks/use-incident-reports';
import { ACCESS_LEVEL, useRBAC } from '@/hooks/useRBAC';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/common/container';
import { IncidentForm } from './components/incident-form';
import { IncidentList } from './components/incident-list';
import { IncidentSingleReport } from './components/incident-single-report';

type ViewMode = 'list' | 'form' | 'print-single';

export function IncidentManagementPage() {
  const { idOrRef } = useParams<{ idOrRef?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { hasAccess } = useRBAC();

  // Redirect legacy search params to clean paths
  const legacyId = searchParams.get('id');
  const legacyMode = searchParams.get('mode');
  const legacyPrint = searchParams.get('print') === 'true';

  useEffect(() => {
    if (legacyId) {
      navigate(`/incidents/${legacyId}${legacyPrint ? '/print' : ''}`, {
        replace: true,
      });
    } else if (legacyMode === 'new') {
      navigate('/incidents/new', { replace: true });
    }
  }, [legacyId, legacyMode, legacyPrint, navigate]);

  const isNewMode = location.pathname.endsWith('/new');
  const isPrintSingle = location.pathname.endsWith('/print');

  const incidentIdOrRef = isNewMode ? undefined : idOrRef;

  // Fetch single incident if ID or Ref is present in URL
  const { data: loadedIncident, isLoading: isLoadingIncident } =
    useIncidentReport(incidentIdOrRef);

  const viewMode: ViewMode = isNewMode
    ? 'form'
    : incidentIdOrRef
      ? isPrintSingle
        ? 'print-single'
        : 'form'
      : 'list';

  const editingIncident = incidentIdOrRef ? loadedIncident || null : null;

  const canReport = hasAccess({
    resource: RBAC_MODULES.REPORTING_CLINICAL,
    requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE,
  });

  const { mutateAsync: createIncident, isPending: isCreating } =
    useCreateIncidentReport();
  const { mutateAsync: updateIncident, isPending: isUpdating } =
    useUpdateIncidentReport();

  const handleEdit = (incident: IncidentReport) => {
    navigate(`/incidents/${incident.reference_id || incident.id}`);
  };

  const handleAddNew = () => {
    navigate('/incidents/new');
  };

  const handleBackToList = () => {
    navigate('/incidents');
  };

  const handleBackToEdit = () => {
    if (incidentIdOrRef) {
      navigate(`/incidents/${incidentIdOrRef}`);
    } else {
      navigate('/incidents');
    }
  };

  const handlePrintPreview = () => {
    if (editingIncident) {
      navigate(
        `/incidents/${editingIncident.reference_id || editingIncident.id}/print`,
      );
    }
  };

  const handleSave = async (data: any) => {
    try {
      if (loadedIncident?.id) {
        await updateIncident({ id: loadedIncident.id, ...data });
        toast.success('Incident report updated successfully');
      } else {
        await createIncident(data);
        toast.success('Incident report lodged successfully');
      }
      navigate('/incidents');
    } catch (error: any) {
      console.error('Error saving incident:', error);
      toast.error(
        'Failed to save incident report: ' + (error.message || 'Unknown error'),
      );
    }
  };

  if (incidentIdOrRef && isLoadingIncident) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-gray-500">
          Loading incident details...
        </p>
      </div>
    );
  }

  if (incidentIdOrRef && !isLoadingIncident && !loadedIncident) {
    return (
      <Container className="py-20 text-center space-y-4">
        <ShieldAlert className="size-12 text-destructive mx-auto" />
        <h3 className="text-lg font-bold text-gray-900">Incident Not Found</h3>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          The incident report you are looking for does not exist or you do not
          have permission to view it.
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBackToList}
                    disabled={isCreating || isUpdating}
                  >
                    <ArrowLeft className="size-4 me-1.5" />
                    Back to List
                  </Button>
                )}
                {viewMode === 'print-single' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBackToEdit}
                  >
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
                  {viewMode === 'list' ? (
                    <ToolbarDescription>
                      Review, action, and manage all clinical and operational
                      incidents.
                    </ToolbarDescription>
                  ) : viewMode === 'print-single' ? (
                    <ToolbarDescription>
                      Print view for{' '}
                      {editingIncident?.reference_id || 'incident report'}.
                    </ToolbarDescription>
                  ) : null}
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
                  <FileSearch className="size-4 me-2" />
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
                  <h4 className="text-sm font-bold text-amber-900 uppercase tracking-tight">
                    Clinical Safety
                  </h4>
                  <p className="text-xs text-amber-700/80 leading-relaxed mt-1 font-medium">
                    Accurate reporting is vital for NDIS compliance and ensuring
                    the highest standard of care for our participants.
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
