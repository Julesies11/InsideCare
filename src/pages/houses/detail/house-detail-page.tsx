import { Fragment, useState, useRef, useCallback, useEffect } from 'react';
import { useParams } from 'react-router';
import { Container } from '@/components/common/container';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LayoutDashboard } from 'lucide-react';
import { HouseDetailContent } from './house-detail-content';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/partials/common/toolbar';
import { useDirtyTracker } from '@/hooks/useDirtyTracker';
import { useUpdateHouse } from '@/hooks/use-houses';
import { HousePendingChanges, emptyHousePendingChanges } from '@/models/house-pending-changes';
import { House } from '@/models/house';
import { useAuth } from '@/auth/context/auth-context';
import { HouseRosterWizard } from './components/HouseRosterWizard';

export function HouseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { mutateAsync: updateHouse } = useUpdateHouse();
  const { isAdmin } = useAuth();
  const [formData, setFormData] = useState<Record<string, any> | null>(null);
  const [originalData, setOriginalData] = useState<Record<string, any> | null>(null);
  const [house, setHouse] = useState<House | null>(null);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
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
              {isAdmin && (
                <Button 
                  variant={house?.is_configured ? "outline" : "warning"} 
                  size="sm" 
                  className="gap-2 font-bold shadow-sm"
                  onClick={() => setShowSetupWizard(true)}
                >
                  <LayoutDashboard className="size-4" />
                  {house?.is_configured 
                    ? "Setup Wizard" 
                    : `Resume Setup (${Math.round(((house?.setup_step || 1) / 3) * 100)}%)`
                  }
                </Button>
              )}
              <Button 
                onClick={handleSave} 
                disabled={!isDirty || saving}
                variant={isDirty ? 'primary' : 'secondary'}
                size="sm"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </ToolbarActions>
          </Toolbar>
        </Container>
      </div>
      <Container className="py-6">
        <HouseDetailContent 
          onFormDataChange={setFormData}
          onOriginalDataChange={setOriginalData}
          onHouseChange={setHouse}
          onSavingChange={setSaving}
          saveHandlerRef={saveHandlerRef}
          pendingChanges={pendingChanges}
          onPendingChangesChange={setPendingChanges}
          canEdit={isAdmin}
        />
      </Container>

      {id && house && (
        <HouseRosterWizard
          open={showSetupWizard}
          onOpenChange={setShowSetupWizard}
          houseId={id}
          houseName={house.name}
          pendingChanges={pendingChanges}
          onPendingChangesChange={setPendingChanges}
          initialStep={house.setup_step}
        />
      )}
    </Fragment>
  );
}

