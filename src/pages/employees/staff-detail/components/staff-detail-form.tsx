import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PersonalDetails } from './personal-details';
import { EmploymentDetails } from './employment-details';
import { StaffAvailability } from './staff-availability';
import { EmergencyContact } from './emergency-contact';
import { StaffComplianceSection } from './staff-compliance';
import { StaffRoster } from './staff-roster';
import { StaffTrainingSection } from './staff-training';
import { StaffActivityLog } from './staff-activity-log';
import { StaffPendingChanges } from '@/models/staff-pending-changes';
import { Documents } from './documents';

interface StaffDetailFormProps {
  staffId: string;
  formData: Record<string, any>;
  onFormDataChange: (data: Record<string, any>) => void;
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
      {/* 1. Personal Details */}
      <PersonalDetails
        formData={formData}
        onFormChange={handleFormChange}
        canEdit={canEdit}
        validationErrors={validationErrors}
      />

      {/* 2. Employment Details */}
      <EmploymentDetails
        formData={formData}
        onFormChange={handleFormChange}
        canEdit={canEdit}
        validationErrors={validationErrors}
        currentStaffId={staffId}
      />

      {/* 3. Availability */}
      <StaffAvailability
        formData={formData}
        onFormChange={handleFormChange}
        canEdit={canEdit}
      />

      {/* 4. Emergency Contact */}
      <EmergencyContact
        formData={formData}
        onFormChange={handleFormChange}
        canEdit={canEdit}
      />

      {/* 5. Compliance */}
      <StaffComplianceSection
        formData={formData}
        onFormChange={handleFormChange}
        canEdit={canEdit}
      />

      {/* 6. Training */}
      <StaffTrainingSection
        key={`training-${trainingRefreshKey}`}
        staffId={staffId}
        pendingChanges={pendingChanges}
        onPendingChangesChange={onPendingChangesChange}
        refreshKey={trainingRefreshKey}
      />

      {/* 7. Documents */}
      <Documents
        key={`documents-${documentsRefreshKey}`}
        staffId={staffId}
        staffName={staffName}
        canAdd={canEdit}
        canDelete={canEdit}
        pendingChanges={pendingChanges}
        onPendingChangesChange={onPendingChangesChange}
      />

      {/* 8. Roster */}
      <StaffRoster
        staffId={staffId}
        canEdit={canEdit}
      />

      {/* 9. Leave */}
      <Card className="pb-2.5" id="staff_leave">
        <CardHeader>
          <CardTitle>Leave</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
            <p className="text-sm font-medium">Leave Management section coming soon.</p>
          </div>
        </CardContent>
      </Card>

      {/* 10. Warnings */}
      <Card className="pb-2.5" id="staff_warnings">
        <CardHeader>
          <CardTitle>Warnings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
            <p className="text-sm font-medium">Staff Warnings section coming soon.</p>
          </div>
        </CardContent>
      </Card>

      {/* 11. Activity Log */}
      <StaffActivityLog staffId={staffId} refreshTrigger={activityRefreshTrigger} />
    </div>
  );
}
