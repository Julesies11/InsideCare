import { PersonalDetails } from './personal-details';
import { EmploymentDetails } from './employment-details';
import { EmergencyContact } from './emergency-contact';
import { StaffComplianceSection } from './staff-compliance';
import { StaffResourcesSection } from './staff-resources';
import { StaffActivityLog } from './staff-activity-log';
import { PendingChanges } from '@/models/pending-changes';

interface StaffDetailFormProps {
  staffId: string;
  formData: any;
  onFormDataChange: (data: any) => void;
  canEdit: boolean;
  pendingChanges?: PendingChanges;
  onPendingChangesChange?: (changes: PendingChanges) => void;
  activityRefreshTrigger?: number;
  validationErrors?: Record<string, string>;
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
        staffId={staffId}
        pendingChanges={pendingChanges}
        onPendingChangesChange={onPendingChangesChange}
      />
      <StaffResourcesSection
        pendingChanges={pendingChanges}
        onPendingChangesChange={onPendingChangesChange}
      />
      <StaffActivityLog staffId={staffId} refreshTrigger={activityRefreshTrigger} />
    </div>
  );
}
