import { Fragment, useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Container } from '@/components/common/container';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { StaffDetailContent } from './staff-detail-content.tsx';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/partials/common/toolbar';
import { useSettings } from '@/providers/settings-provider';
import { PendingChanges } from '@/models/pending-changes';
import { createPendingChanges } from '@/lib/pending-changes-factory';
import { useDirtyTracker } from '@/hooks/useDirtyTracker';

export function StaffDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { settings } = useSettings();
  const [formData, setFormData] = useState<any>(null);
  const [originalData, setOriginalData] = useState<any>(null);
  const [pendingChanges, setPendingChanges] = useState<PendingChanges>(createPendingChanges());
  const [saving, setSaving] = useState(false);
  const saveHandlerRef = useRef<(() => Promise<void>) | null>(null);

  // Use centralized dirty tracking with json-diff-ts
  const { isDirty } = useDirtyTracker({
    formData: formData || {},
    originalData: originalData || {},
    pendingChanges,
  });

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
    navigate('/employees/staff-profiles');
  }, [navigate, isDirty]);

  const handleSave = async () => {
    if (saveHandlerRef.current) {
      await saveHandlerRef.current();
    }
  };

  if (!id) {
    return <div>Staff ID not found</div>;
  }

  return (
    <Fragment>
      {settings?.layout === 'demo1' && (
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
                    <ToolbarPageTitle text="Staff Details" />
                    <ToolbarDescription>
                      View and manage staff member information
                    </ToolbarDescription>
                  </div>
                </div>
              </ToolbarHeading>
              <ToolbarActions>
                <Button
                  onClick={handleSave}
                  disabled={!isDirty || saving}
                  variant={isDirty ? 'primary' : 'secondary'}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </ToolbarActions>
            </Toolbar>
          </Container>
        </div>
      )}
      <Container>
        <StaffDetailContent
          staffId={id}
          onFormDataChange={setFormData}
          onOriginalDataChange={setOriginalData}
          onSavingChange={setSaving}
          saveHandlerRef={saveHandlerRef}
          pendingChanges={pendingChanges}
          onPendingChangesChange={setPendingChanges}
          onSaveSuccess={() => {
            // Clear dirty state after successful save
            setPendingChanges(createPendingChanges());
          }}
        />
      </Container>
    </Fragment>
  );
}
