import { PersonalDetails } from './personal-details';
import { EmploymentDetails } from './employment-details';
import { EmergencyContact } from './emergency-contact';
import { StaffComplianceSection } from './staff-compliance';
import { StaffRoster } from './staff-roster';
import { StaffTrainingSection } from './staff-training';
import { StaffActivityLog } from './staff-activity-log';
import { StaffPendingChanges } from '@/models/staff-pending-changes';
import { Documents } from './documents';

interface StaffDetailFormProps {
  staffId: string;
  formData: any;
  onFormDataChange: (data: any) => void;
  canEdit: boolean;
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
  canEdit,
  pendingChanges,
  onPendingChangesChange,
  activityRefreshTrigger,
  validationErrors = {},
  staffName = '',
  documentsRefreshKey = 0,
  trainingRefreshKey = 0,
}: StaffDetailFormProps) {
  const handleFormChange = (field: string, value: any) => {
    onFormDataChange({
      ...formData,
      [field]: value,
    });
  };

  return (
    <div className="grid gap-2.5 lg:gap-7.5">
      <PersonalDetails
        formData={formData}
        onFormChange={handleFormChange}
        canEdit={canEdit}
        validationErrors={validationErrors}
      />
      <EmploymentDetails
        formData={formData}
        onFormChange={handleFormChange}
        canEdit={canEdit}
        validationErrors={validationErrors}
        currentStaffId={staffId}
      />
      <EmergencyContact
        formData={formData}
        onFormChange={handleFormChange}
        canEdit={canEdit}
      />
      <StaffComplianceSection
        formData={formData}
        onFormChange={handleFormChange}
        canEdit={canEdit}
      />
      <StaffRoster
        staffId={staffId}
        canEdit={canEdit}
      />
      <StaffTrainingSection
        key={`training-${trainingRefreshKey}`}
        pendingChanges={pendingChanges}
        onPendingChangesChange={onPendingChangesChange}
        refreshKey={trainingRefreshKey}
      />
      <Documents
        key={`documents-${documentsRefreshKey}`}
        staffId={staffId}
        staffName={staffName}
        canAdd={canEdit}
        canDelete={canEdit}
        pendingChanges={pendingChanges}
        onPendingChangesChange={onPendingChangesChange}
      />
      <StaffActivityLog staffId={staffId} refreshTrigger={activityRefreshTrigger} />
    </div>
  );
}
