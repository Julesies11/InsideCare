import { Fragment, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
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
import { useDirtyTracker } from '@/hooks/useDirtyTracker';
import { useUpdateHouse } from '@/hooks/use-houses';
import { HousePendingChanges, emptyHousePendingChanges } from '@/models/house-pending-changes';
import { House } from '@/models/house';

import { RBAC_MODULES } from '@/config/rbac-modules';
import { useRBAC, ACCESS_LEVEL } from '@/hooks/useRBAC';

export function HouseDetailPage() {
  const { id: _id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { mutateAsync: _updateHouse } = useUpdateHouse();
  const { hasAccess } = useRBAC();
  
  const canEdit = 
    hasAccess({ resource: RBAC_MODULES.HOUSES, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE }) ||
    hasAccess({ resource: RBAC_MODULES.HOUSE_MANAGEMENT, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE }) ||
    hasAccess({ resource: RBAC_MODULES.HOUSE_OPERATIONS, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE }) ||
    hasAccess({ resource: RBAC_MODULES.HOUSE_CHECKLISTS, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE }) ||
    hasAccess({ resource: RBAC_MODULES.HOUSE_RESOURCES, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE }) ||
    hasAccess({ resource: RBAC_MODULES.HOUSE_STAFF, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE });
  
  const [formData, setFormData] = useState<Record<string, any> | null>(null);
  const [originalData, setOriginalData] = useState<Record<string, any> | null>(null);
  const [_house, setHouse] = useState<House | null>(null);
  const [pendingChanges, setPendingChanges] = useState<HousePendingChanges>(emptyHousePendingChanges);
  const [saving, setSaving] = useState(false);
  const saveHandlerRef = useRef<(() => Promise<void>) | null>(null);

  const handleBack = () => navigate('/houses/profiles');

  const handleSave = async () => {
    if (saveHandlerRef.current) {
      await saveHandlerRef.current();
    }
  };

  const { isDirty } = useDirtyTracker({
    formData: formData || {},
    originalData: originalData || {},
    pendingChanges
  });

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
                    {canEdit ? 'View and manage house information' : 'View house information (Read Only)'}
                  </ToolbarDescription>
                </div>
              </div>
            </ToolbarHeading>
            <ToolbarActions>
              {canEdit && (
                <Button 
                  onClick={handleSave} 
                  disabled={!isDirty || saving}
                  variant={isDirty ? 'primary' : 'secondary'}
                  size="sm"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              )}
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
          canEdit={canEdit}
        />
      </Container>
    </Fragment>
  );
}
