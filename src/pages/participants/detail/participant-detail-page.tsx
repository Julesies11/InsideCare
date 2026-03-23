import { Fragment, useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useLocation } from 'react-router';
import { Container } from '@/components/common/container';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ParticipantDetailContent } from './participant-detail-content';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/partials/common/toolbar';
import { ParticipantPendingChanges, emptyParticipantPendingChanges } from '@/models/participant-pending-changes';
import { useDirtyTracker } from '@/hooks/useDirtyTracker';
import { useUpdateParticipant, useParticipant } from '@/hooks/use-participants';

export function ParticipantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tab = searchParams.get('tab');
  
  const { data: participant } = useParticipant(id);
  const { mutateAsync: updateParticipant } = useUpdateParticipant();
  const [formData, setFormData] = useState<Record<string, any> | null>(null);
  const [originalData, setOriginalData] = useState<Record<string, any> | null>(null);
  const [pendingChanges, setPendingChanges] = useState<ParticipantPendingChanges>(emptyParticipantPendingChanges);
  const [saving, setSaving] = useState(false);
  const [photoDirty, setPhotoDirty] = useState(false);
  const saveHandlerRef = useRef<(() => Promise<void>) | null>(null);

  // Handle deep linking via scroll
  useEffect(() => {
    if (tab) {
      // Small delay to ensure Content is rendered and scrollspy is ready
      const timer = setTimeout(() => {
        const element = document.getElementById(tab);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // Optional: Add a brief highlight effect
          element.classList.add('animate-pulse', 'ring-2', 'ring-primary', 'ring-offset-2');
          setTimeout(() => {
            element.classList.remove('animate-pulse', 'ring-2', 'ring-primary', 'ring-offset-2');
          }, 3000);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [tab, id]);

  // Use centralized dirty tracking with json-diff-ts
  const { isDirty: formIsDirty } = useDirtyTracker({
    formData: formData || {},
    originalData: originalData || {},
    pendingChanges,
  });
  const isDirty = formIsDirty || photoDirty;

  // Warn user before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleBack = useCallback(() => {
    if (isDirty) {
      const confirmLeave = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmLeave) return;
    }
    window.history.back();
  }, [isDirty]);

  const handleSave = async () => {
    if (saveHandlerRef.current) {
      await saveHandlerRef.current();
    }
  };

  return (
    <Fragment>
      <div className="sticky top-0 z-20 bg-background border-b border-border">
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={handleBack}>
                  <ArrowLeft className="size-4 me-1.5" />
                  Back
                </Button>
                <div>
                  <ToolbarPageTitle text="Participant Details" />
                  <ToolbarDescription>
                    View and manage participant information
                  </ToolbarDescription>
                </div>
              </div>
            </ToolbarHeading>
            <ToolbarActions>
              <Button onClick={handleSave} disabled={!isDirty || saving} size="sm">
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </ToolbarActions>
          </Toolbar>
        </Container>
      </div>

      <Container className="py-6">
        {id && (
          <ParticipantDetailContent
            onFormDataChange={setFormData}
            onOriginalDataChange={setOriginalData}
            onSavingChange={setSaving}
            saveHandlerRef={saveHandlerRef}
            pendingChanges={pendingChanges}
            onPendingChangesChange={setPendingChanges}
            updateParticipant={updateParticipant}
            onPhotoDirtyChange={setPhotoDirty}
          />
        )}
      </Container>
    </Fragment>
  );
}
