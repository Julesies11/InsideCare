import { Fragment, useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Container } from '@/components/common/container';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { HouseDetailContent } from './house-detail-content';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/partials/common/toolbar';
import { useSettings } from '@/providers/settings-provider';
import { useDirtyTracker } from '@/hooks/useDirtyTracker';
import { useHouses } from '@/hooks/use-houses';
import { HousePendingChanges, emptyHousePendingChanges } from '@/models/house-pending-changes';

export function HouseDetailPage() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { updateHouse } = useHouses();
  const [formData, setFormData] = useState<any>(null);
  const [originalData, setOriginalData] = useState<any>(null);
  const [pendingChanges, setPendingChanges] = useState<HousePendingChanges>(emptyHousePendingChanges);
  const [saving, setSaving] = useState(false);
  const saveHandlerRef = useRef<(() => Promise<void>) | null>(null);

  // Use centralized dirty tracking
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
    // Use browser back to preserve URL state from previous page
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
                  <ToolbarPageTitle text="House Details" />
                  <ToolbarDescription>
                    View and manage house information
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
      <Container>
        <HouseDetailContent 
          onFormDataChange={setFormData}
          onOriginalDataChange={setOriginalData}
          onSavingChange={setSaving}
          saveHandlerRef={saveHandlerRef}
          updateHouse={updateHouse}
          pendingChanges={pendingChanges}
          onPendingChangesChange={setPendingChanges}
        />
      </Container>
    </Fragment>
  );
}
