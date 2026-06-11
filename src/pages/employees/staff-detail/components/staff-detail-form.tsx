import { StaffPendingChanges } from '@/models/staff-pending-changes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RBAC_MODULES } from '@/config/rbac-modules';
import { ACCESS_LEVEL, useRBAC } from '@/hooks/useRBAC';
import { Documents } from './documents';
import { EmergencyContact } from './emergency-contact';
import { EmploymentDetails } from './employment-details';
import { PersonalDetails } from './personal-details';
import { StaffActivityLog } from './staff-activity-log';
import { StaffAvailability } from './staff-availability';
import { StaffOnboardingSection } from './staff-onboarding';
import { StaffComplianceSection } from './staff-compliance';
import { StaffRoster } from './staff-roster';
import { StaffTrainingSection } from './staff-training';
import { StaffQualificationsSection } from './staff-qualifications';

interface StaffDetailFormProps {
  staffId: string;
  formData: Record<string, any>;
  onFormDataChange: (data: Record<string, any>) => void;
  canEditPersonal?: boolean;
  canEditEmployment?: boolean;
  canEditAvailability?: boolean;
  canEditEmergency?: boolean;
  canEditCompliance?: boolean;
  canEditTraining?: boolean;
  canEditQualifications?: boolean;
  canEditDocuments?: boolean;
  canDeleteDocuments?: boolean;
  canEditRoster?: boolean;
  canEditLeave?: boolean;
  canEditWarnings?: boolean;
  canViewPersonal?: boolean;
  canViewEmployment?: boolean;
  canViewAvailability?: boolean;
  canViewEmergency?: boolean;
  canViewCompliance?: boolean;
  canViewTraining?: boolean;
  canViewQualifications?: boolean;
  canViewDocuments?: boolean;
  canViewRoster?: boolean;
  canViewLeave?: boolean;
  canViewWarnings?: boolean;
  canViewActivityLog?: boolean;
  pendingChanges?: StaffPendingChanges;
  onPendingChangesChange?: (changes: StaffPendingChanges) => void;
  activityRefreshTrigger?: number;
  validationErrors?: Record<string, string>;
  staffName?: string;
  documentsRefreshKey?: number;
  trainingRefreshKey?: number;
}

export function StaffDetailForm({
  staffId,
  formData,
  onFormDataChange,
  canEditPersonal = false,
  canEditEmployment = false,
  canEditAvailability = false,
  canEditEmergency = false,
  canEditCompliance = false,
  canEditTraining = false,
  canEditQualifications = false,
  canEditDocuments = false,
  canEditRoster = false,
  canEditLeave = false,
  canEditWarnings = false,
  canViewPersonal = false,
  canViewEmployment = false,
  canViewAvailability = false,
  canViewEmergency = false,
  canViewCompliance = false,
  canViewTraining = false,
  canViewQualifications = false,
  canViewDocuments = false,
  canViewRoster = false,
  canViewLeave = false,
  canViewWarnings = false,
  canViewActivityLog = false,
  pendingChanges,
  onPendingChangesChange,
  activityRefreshTrigger,
  validationErrors = {},
  staffName = '',
  documentsRefreshKey = 0,
  trainingRefreshKey = 0,
  qualificationsRefreshKey = 0,
}: StaffDetailFormProps) {
  const { hasAccess } = useRBAC();

  const canViewOnboarding = hasAccess({
    resource: RBAC_MODULES.STAFF_ONBOARDING,
    requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY,
  });
  const canEditOnboarding = hasAccess({
    resource: RBAC_MODULES.STAFF_ONBOARDING,
    requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE,
  });

  const handleFormChange = (field: string, value: any) => {
    onFormDataChange({
      ...formData,
      [field]: value,
    });
  };

  return (
    <div className="grid gap-2.5 lg:gap-7.5">
      {/* 1. Personal Details */}
      {canViewPersonal && (
        <PersonalDetails
          formData={formData}
          onFormChange={handleFormChange}
          canEdit={canEditPersonal}
          validationErrors={validationErrors}
          onSave={() => {}} // Pass a dummy for now as parent handles save
        />
      )}

      {/* 2. Employment Details */}
      {canViewEmployment && (
        <EmploymentDetails
          formData={formData}
          onFormChange={handleFormChange}
          canEdit={canEditEmployment}
          validationErrors={validationErrors}
          currentStaffId={staffId}
        />
      )}

      {/* 3. Onboarding */}
      {canViewOnboarding && (
        <StaffOnboardingSection
          staffId={staffId}
          canEdit={canEditOnboarding}
          pendingChanges={pendingChanges}
          onPendingChangesChange={onPendingChangesChange}
        />
      )}

      {/* 3. Availability */}
      {canViewAvailability && (
        <StaffAvailability
          formData={formData}
          onFormChange={handleFormChange}
          canEdit={canEditAvailability}
        />
      )}

      {/* 4. Emergency Contact */}
      {canViewEmergency && (
        <EmergencyContact
          formData={formData}
          onFormChange={handleFormChange}
          canEdit={canEditEmergency}
        />
      )}

      {/* 5. Compliance */}
      {canViewCompliance && (
        <StaffComplianceSection
          staffId={staffId}
          canEdit={canEditCompliance}
          pendingChanges={pendingChanges}
          onPendingChangesChange={onPendingChangesChange}
          staffName={staffName}
        />
      )}

      {/* 6. Training */}
      {canViewTraining && (
        <StaffTrainingSection
          key={`training-${trainingRefreshKey}`}
          staffId={staffId}
          canEdit={canEditTraining}
          pendingChanges={pendingChanges}
          onPendingChangesChange={onPendingChangesChange}
          refreshKey={trainingRefreshKey}
        />
      )}

      {/* 7. Qualifications */}
      {canViewQualifications && (
        <StaffQualificationsSection
          key={`qualifications-${qualificationsRefreshKey}`}
          staffId={staffId}
          canEdit={canEditQualifications}
          pendingChanges={pendingChanges}
          onPendingChangesChange={onPendingChangesChange}
          refreshKey={qualificationsRefreshKey}
        />
      )}

      {/* 8. Documents */}
      {canViewDocuments && (
        <Documents
          key={`documents-${documentsRefreshKey}`}
          staffId={staffId}
          staffName={staffName}
          canAdd={canEditDocuments}
          canDelete={canEditDocuments}
          pendingChanges={pendingChanges}
          onPendingChangesChange={onPendingChangesChange}
        />
      )}

      {/* 8. Roster */}
      {canViewRoster && (
        <StaffRoster staffId={staffId} canEdit={canEditRoster} />
      )}

      {/* 9. Leave */}
      {canViewLeave && (
        <Card className="pb-2.5" id="staff_leave">
          <CardHeader>
            <CardTitle>Leave</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
              <p className="text-sm font-medium">
                Leave Management section coming soon.
              </p>
              {!canEditLeave && <p className="text-xs italic">(Read Only)</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 10. Warnings */}
      {canViewWarnings && (
        <Card className="pb-2.5" id="staff_warnings">
          <CardHeader>
            <CardTitle>Warnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
              <p className="text-sm font-medium">
                Staff Warnings section coming soon.
              </p>
              {!canEditWarnings && (
                <p className="text-xs italic">(Read Only)</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 11. Activity Log */}
      {canViewActivityLog && (
        <StaffActivityLog
          staffId={staffId}
          refreshTrigger={activityRefreshTrigger}
        />
      )}
    </div>
  );
}
