import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Scrollspy } from '@/components/ui/scrollspy';
import { useSettings } from '@/providers/settings-provider';
import { useIsMobile } from '@/hooks/use-mobile';
import { useScrollPosition } from '@/hooks/use-scroll-position';
import { cn } from '@/lib/utils';
import { HouseDetailSidebar } from './house-detail-sidebar';
import { HouseStaff } from './components/house-staff';
import { HouseCalendarEvents } from './components/house-calendar-events';
import { HouseChecklistSetup } from './components/house-checklist-setup';
import { HouseResources } from './components/house-resources';
import { HouseComms } from './components/house-comms';
import { HouseChecklistHistory } from './components/house-checklist-history';
import { HouseManagement } from './components/house-management';
import { HousePendingChanges, emptyHousePendingChanges } from '@/models/house-pending-changes';
import { useAuth } from '@/auth/context/auth-context';
import { useQueryClient } from '@tanstack/react-query';
import { ActivityLog } from '@/components/activities/ActivityLog';
import { syncUserPermissionsByStaffId } from '@/lib/rbac-sync';
import { QUERY_KEYS } from '@/config/query-keys';
import { useRBAC, ACCESS_LEVEL } from '@/hooks/useRBAC';
import { RBAC_MODULES } from '@/config/rbac-modules';
import { housesApi } from '@/api/houses.api';
import { houseOperationsApi } from '@/api/house-operations.api';

const stickySidebarClasses: Record<string, string> = {
  'demo1-layout': 'top-[calc(var(--header-height)+1rem)]',
  'demo2-layout': 'top-[calc(var(--header-height)+1rem)]',
  'demo3-layout': 'top-[calc(var(--header-height)+var(--navbar-height)+1rem)]',
  'demo4-layout': 'top-[3rem]',
  'demo5-layout': 'top-[calc(var(--header-height)+1.5rem)]',
  'demo6-layout': 'top-[3rem]',
  'demo7-layout': 'top-[calc(var(--header-height)+1rem)]',
  'demo8-layout': 'top-[3rem]',
  'demo9-layout': 'top-[calc(var(--header-height)+1rem)]',
  'demo10-layout': 'top-[1.5rem]',
};

interface HouseDetailContentProps {
  onFormDataChange?: (data: any) => void;
  onOriginalDataChange?: (data: any) => void;
  onHouseChange?: (house: any) => void;
  pendingChanges: HousePendingChanges;
  onPendingChangesChange: (changes: HousePendingChanges) => void;
  canEdit: boolean; // Base canEdit from parent
  onSavingChange?: (saving: boolean) => void;
  saveHandlerRef?: React.MutableRefObject<(() => Promise<void>) | null>;
  onSaveSuccess?: () => void;
}

export function HouseDetailContent({
  onFormDataChange,
  onOriginalDataChange,
  onHouseChange,
  pendingChanges,
  onPendingChangesChange,
  onSavingChange,
  saveHandlerRef,
  onSaveSuccess,
}: HouseDetailContentProps) {
  const { id } = useParams();
  const { hasAccess } = useRBAC();
  const queryClient = useQueryClient();
  const { settings } = useSettings();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [house, setHouse] = useState<any>(null);
  const [sidebarSticky, setSidebarSticky] = useState(false);
  const parentRef = useRef<HTMLElement | Document>(document);
  const scrollPosition = useScrollPosition({ targetRef: parentRef });

  // Permissions
  const canViewBasics = hasAccess({ resource: RBAC_MODULES.HOUSES, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY });
  const canEditBasics = hasAccess({ resource: RBAC_MODULES.HOUSES, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE });

  const canViewManagement = hasAccess({ resource: RBAC_MODULES.HOUSE_MANAGEMENT, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY });
  const canEditManagement = hasAccess({ resource: RBAC_MODULES.HOUSE_MANAGEMENT, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE });

  const canViewOperations = hasAccess({ resource: RBAC_MODULES.HOUSE_OPERATIONS, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY });
  const canEditOperations = hasAccess({ resource: RBAC_MODULES.HOUSE_OPERATIONS, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE });

  const canViewChecklistSetup = hasAccess({ resource: RBAC_MODULES.HOUSE_CHECKLISTS, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY });
  const canEditChecklistSetup = hasAccess({ resource: RBAC_MODULES.HOUSE_CHECKLISTS, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE });

  const canViewChecklistHistory = hasAccess({ resource: RBAC_MODULES.HOUSE_CHECKLIST_HISTORY, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY });

  const canViewResources = hasAccess({ resource: RBAC_MODULES.HOUSE_RESOURCES, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY });
  const canEditResources = hasAccess({ resource: RBAC_MODULES.HOUSE_RESOURCES, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE });

  const canViewStaff = hasAccess({ resource: RBAC_MODULES.HOUSE_STAFF, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY });
  const canEditStaff = hasAccess({ resource: RBAC_MODULES.HOUSE_STAFF, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE });

  const canViewActivityLog = hasAccess({ resource: RBAC_MODULES.HOUSE_ACTIVITY_LOG, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY });

  const [formData, setFormData] = useState<any>({
    house_name: '',
    address: '',
    phone: '',
    house_type_id: '',
    capacity: 0,
    current_occupancy: 0,
    house_manager: '',
    status: 'active',
    notes: '',
    individuals_breakdown: '',
    participant_dynamics: '',
    observations: '',
    general_house_details: '',
    risk_management: '',
  });
  const [originalData, setOriginalData] = useState<any>(null);

  // Keep track of the latest props/state via refs to avoid closure staleness in handleSave
  const latestPendingChanges = useRef(pendingChanges);
  const latestFormData = useRef(formData);
  const latestOriginalData = useRef(originalData);

  useEffect(() => {
    latestPendingChanges.current = pendingChanges;
    latestFormData.current = formData;
    latestOriginalData.current = originalData;
  }, [pendingChanges, formData, originalData]);

  const [refreshKeys, setRefreshKeys] = useState({
    staff: 0,
    participants: 0,
    calendarEvents: 0,
    documents: 0,
    checklists: 0,
    forms: 0,
    resources: 0,
    comms: 0,
    activityLog: 0,
  });

  // Handle scroll position and sidebar stickiness
  useEffect(() => {
    setSidebarSticky(scrollPosition > 100);
  }, [scrollPosition]);

  useEffect(() => {
    const fetchHouse = async () => {
      try {
        setLoading(true);
        const data = await housesApi.get(id!);
        if (!data) throw new Error("You do not have permission to perform this action");
        
        setHouse(data);
        setOriginalData(data);
        setFormData(data);
      } catch (err) {
        console.error('Error fetching house:', err);
        toast.error('Failed to load house details');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchHouse();
  }, [id]);

  // Sync state to parent on mount or when data is fully loaded/updated
  useEffect(() => {
    if (!loading && house) {
      onHouseChange?.(house);
      onOriginalDataChange?.(originalData);
    }
  }, [loading, house, originalData, onHouseChange, onOriginalDataChange]);

  useEffect(() => {
    if (!loading && formData) {
      latestFormData.current = formData;
      onFormDataChange?.(formData);
    }
  }, [loading, formData, onFormDataChange]);


  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = useCallback(async () => {
    const currentPending = latestPendingChanges.current;
    const currentFormData = latestFormData.current;

    if (!id || !house) return;

    if (onSavingChange) onSavingChange(true);

    try {
      // 1. Save main house details
      const updates: any = {};
      if (canEditBasics) {
        updates.house_name = currentFormData.house_name;
        updates.address = currentFormData.address || null;
        updates.phone = currentFormData.phone || null;
        updates.house_type_id = currentFormData.house_type_id || null;
        updates.capacity = currentFormData.capacity || 0;
        updates.current_occupancy = currentFormData.current_occupancy || 0;
        updates.house_manager = currentFormData.house_manager || null;
        updates.status = currentFormData.status;
        updates.notes = currentFormData.notes || null;
      }
      if (canEditManagement) {
        updates.individuals_breakdown = currentFormData.individuals_breakdown || null;
        updates.participant_dynamics = currentFormData.participant_dynamics || null;
        updates.observations = currentFormData.observations || null;
        updates.general_house_details = currentFormData.general_house_details || null;
        updates.risk_management = currentFormData.risk_management || null;
      }

      if (Object.keys(updates).length > 0) {
        const updatedHouse = await housesApi.update(id, updates);
        setHouse(updatedHouse);
      }

      // 2. Process all pending operational changes in bulk
      await houseOperationsApi.syncOperations(id, currentPending);

      // 3. Final Step: Refresh and Reset
      setOriginalData(currentFormData);
      if (onOriginalDataChange) onOriginalDataChange(currentFormData);
      if (onFormDataChange) onFormDataChange(currentFormData);

      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.HOUSES] });
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.HOUSE_STAFF_ASSIGNMENTS] });
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PARTICIPANTS] });
      await queryClient.invalidateQueries({ queryKey: ['house-participants', { houseId: id }] });
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CALENDAR_EVENTS, { houseId: id }] });
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CHECKLISTS, id] });
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.HOUSE_RESOURCES, id] });
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.HOUSE_COMMS, id] });

      toast.success('All changes saved successfully');
      onSaveSuccess?.();

      setRefreshKeys(prev => ({
        ...prev,
        activityLog: prev.activityLog + 1,
      }));

      if (onPendingChangesChange) {
        onPendingChangesChange(emptyHousePendingChanges);
      }

      // Sync RBAC for affected staff (Async)
      const staffIdsToSync = new Set<string>();
      currentPending.staff.toAdd.forEach(s => staffIdsToSync.add(s.staff_id));
      currentPending.staff.toUpdate.forEach(s => { if (s.staff_id) staffIdsToSync.add(s.staff_id); });
      Array.from(staffIdsToSync).forEach(sId => syncUserPermissionsByStaffId(sId));

    } catch (error: any) {
      console.error('Error saving house changes:', error);
      toast.error('Failed to save changes', { description: error.message });
    } finally {
      if (onSavingChange) onSavingChange(false);
    }
  }, [id, house, onSavingChange, onOriginalDataChange, onFormDataChange, onPendingChangesChange, canEditBasics, canEditManagement, queryClient, onSaveSuccess]);

  useEffect(() => {
    if (saveHandlerRef) {
      saveHandlerRef.current = handleSave;
    }
  }, [saveHandlerRef, handleSave]);

  const stickyClass = settings?.layout
    ? stickySidebarClasses[`${settings?.layout}-layout`] ||
      'top-[calc(var(--header-height)+1rem)]'
    : 'top-[calc(var(--header-height)+1rem)]';

  if (loading && !house) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-muted-foreground animate-pulse font-medium">Loading house details...</div>
      </div>
    );
  }

  if (!house) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-muted-foreground font-medium text-center">
          <p>House not found.</p>
          <Button variant="link" onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex grow gap-5 lg:gap-7.5">
      {!isMobile && (
        <div className="w-[230px] shrink-0">
          <div
            className={cn(
              'w-[230px]',
              sidebarSticky && `fixed z-10 start-auto ${stickyClass}`,
            )}
          >
            <Scrollspy offset={100} targetRef={parentRef}>
              <HouseDetailSidebar />
            </Scrollspy>
          </div>
        </div>
      )}

      <div className="flex flex-col items-stretch grow gap-5 lg:gap-7.5">
          {canViewBasics && (
            <Card id="house_details">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>House Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-5">
                  <div className="w-full">
                    <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                      <Label htmlFor="house_name" className="flex w-full max-w-56">House Name</Label>
                      <Input
                        id="house_name"
                        value={formData.house_name}
                        onChange={(e) => handleFieldChange('house_name', e.target.value)}
                        placeholder="Enter house name"
                        disabled={!canEditBasics}
                      />
                    </div>
                  </div>

                  <div className="w-full">
                    <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                      <Label htmlFor="address" className="flex w-full max-w-56">Address</Label>
                      <Textarea
                        id="address"
                        value={formData.address || ''}
                        onChange={(e) => handleFieldChange('address', e.target.value)}
                        placeholder="Enter house address"
                        disabled={!canEditBasics}
                        rows={2}
                      />
                    </div>
                  </div>

                  <div className="w-full">
                    <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                      <Label htmlFor="phone" className="flex w-full max-w-56">Phone Number</Label>
                      <Input
                        id="phone"
                        value={formData.phone || ''}
                        onChange={(e) => handleFieldChange('phone', e.target.value)}
                        placeholder="Enter phone number"
                        disabled={!canEditBasics}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {canViewManagement && (
            <HouseManagement
              houseId={id}
              formData={formData}
              onFieldChange={handleFieldChange}
              canEdit={canEditManagement}
              pendingChanges={pendingChanges}
              onPendingChangesChange={onPendingChangesChange}
            />
          )}

          {canViewOperations && (
            <div id="daily_operations" className="flex flex-col gap-5 lg:gap-7.5">
              <HouseCalendarEvents 
                houseId={id!} 
                houseName={formData.house_name}
                events={formData.calendarEvents || []}
                pendingChanges={pendingChanges}
                onPendingChangesChange={onPendingChangesChange}
                canEdit={canEditOperations}
              />

              <HouseComms 
                houseId={id!} 
                canEdit={canEditOperations}
                pendingChanges={pendingChanges}
                onPendingChangesChange={onPendingChangesChange}
              />
            </div>
          )}

          {canViewChecklistSetup && (
            <div id="checklists">
              <HouseChecklistSetup 
                houseId={id!} 
                canAdd={canEditChecklistSetup}
                canEdit={canEditChecklistSetup}
                canDelete={canEditChecklistSetup}
                pendingChanges={pendingChanges}
                onPendingChangesChange={onPendingChangesChange}
                onRefresh={() => queryClient.invalidateQueries({ queryKey: ['house-checklists', id] })}
              />
            </div>
          )}

          {canViewChecklistHistory && (
            <HouseChecklistHistory houseId={id!} />
          )}

          {canViewResources && (
            <HouseResources 
              houseId={id!} 
              canAdd={canEditResources}
              canDelete={canEditResources}
              pendingChanges={pendingChanges}
              onPendingChangesChange={onPendingChangesChange}
            />
          )}

          {canViewStaff && (
            <HouseStaff 
              houseId={id!} 
              canAdd={canEditStaff}
              canDelete={canEditStaff}
              pendingChanges={pendingChanges}
              onPendingChangesChange={onPendingChangesChange}
            />
          )}

          {canViewActivityLog && (
            <ActivityLog 
              entityId={id} 
              entityType="house" 
              refreshTrigger={refreshKeys.activityLog}
            />
          )}
      </div>

    </div>
  );
}
