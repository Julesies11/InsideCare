import { PersonalDetails } from './personal-details';
import { EmploymentDetails } from './employment-details';
import { EmergencyContact } from './emergency-contact';
import { AdditionalInfo } from './additional-info';
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
}

export function StaffDetailForm({
  staffId,
  formData,
  onFormDataChange,
  canEdit,
  pendingChanges,
  onPendingChangesChange,
  activityRefreshTrigger,
}: StaffDetailFormProps) {
  const handleFormChange = (field: string, value: any) => {
    onFormDataChange({
      ...formData,
      [field]: value,
    });
  };

  return (
    <div className="grid gap-5 lg:gap-7.5">
      <PersonalDetails
        formData={formData}
        onFormChange={handleFormChange}
        canEdit={canEdit}
      />
      <EmploymentDetails
        formData={formData}
        onFormChange={handleFormChange}
        canEdit={canEdit}
      />
      <EmergencyContact
        formData={formData}
        onFormChange={handleFormChange}
        canEdit={canEdit}
      />
      <AdditionalInfo
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
