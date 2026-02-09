import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DepartmentCombobox } from './employment-components/department-combobox';
import { EmploymentTypeCombobox } from './employment-components/employment-type-combobox';
import { DepartmentMasterDialog } from './employment-components/department-master-dialog';
import { EmploymentTypeMasterDialog } from './employment-components/employment-type-master-dialog';
import { useStaff } from '@/hooks/useStaff';

interface EmploymentDetailsProps {
  formData: any;
  onFormChange: (field: string, value: any) => void;
  canEdit: boolean;
  validationErrors?: Record<string, string>;
  currentStaffId?: string;
}

export function EmploymentDetails({
  formData,
  onFormChange,
  canEdit,
  validationErrors = {},
  currentStaffId,
}: EmploymentDetailsProps) {
  const [showDepartmentDialog, setShowDepartmentDialog] = useState(false);
  const [showEmploymentTypeDialog, setShowEmploymentTypeDialog] = useState(false);
  const [refreshDepartmentKey, setRefreshDepartmentKey] = useState(0);
  const [refreshEmploymentTypeKey, setRefreshEmploymentTypeKey] = useState(0);
  const { staff } = useStaff();

  // Filter active staff for manager dropdown, excluding current staff member
  const activeStaff = staff.filter(s => 
    s.status === 'active' && s.id !== currentStaffId
  );
  
  // Include currently selected manager even if inactive, so it displays after save
  const currentManager = formData.manager_id 
    ? staff.find(s => s.id === formData.manager_id)
    : null;
  
  const managerOptions = currentManager && !activeStaff.find(s => s.id === currentManager.id)
    ? [currentManager, ...activeStaff]
    : activeStaff;
  return (
    <>
    <Card className="pb-2.5" id="employment_details">
      <CardHeader>
        <CardTitle>Employment Details</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2.5">
        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <Label className="flex w-full max-w-56">Department</Label>
            <DepartmentCombobox
              value={formData.department_id || ''}
              onChange={(value) => onFormChange('department_id', value)}
              canEdit={canEdit}
              onManageList={() => setShowDepartmentDialog(true)}
              onRefresh={refreshDepartmentKey > 0 ? () => {} : undefined}
            />
          </div>
        </div>

        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <Label className="flex w-full max-w-56">Employment Type</Label>
            <EmploymentTypeCombobox
              value={formData.employment_type_id || ''}
              onChange={(value) => onFormChange('employment_type_id', value)}
              canEdit={canEdit}
              onManageList={() => setShowEmploymentTypeDialog(true)}
              onRefresh={refreshEmploymentTypeKey > 0 ? () => {} : undefined}
            />
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <Label className="flex w-full max-w-56">Manager</Label>
          <div className="grow">
            <Select 
              value={formData.manager_id || undefined} 
              onValueChange={(value) => onFormChange('manager_id', value || null)}
              disabled={!canEdit}
            >
              <SelectTrigger id="manager_id">
                <SelectValue placeholder="Select manager (optional)" />
              </SelectTrigger>
              <SelectContent>
                {managerOptions.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <Label className="flex w-full max-w-56">Status</Label>
          <div className="grow">
            <Select 
              value={formData.status || 'draft'} 
              onValueChange={(value) => onFormChange('status', value)}
              disabled={!canEdit}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <Label className="flex w-full max-w-56">Hire Date</Label>
            <Input
              id="hire_date"
              type="date"
              value={formData.hire_date || ''}
              onChange={(e) => onFormChange('hire_date', e.target.value)}
              disabled={!canEdit}
            />
          </div>
        </div>

        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <Label className="flex w-full max-w-56">Availability</Label>
            <Textarea
              id="availability"
              placeholder="Staff availability schedule"
              value={formData.availability || ''}
              onChange={(e) => onFormChange('availability', e.target.value)}
              disabled={!canEdit}
              rows={3}
            />
          </div>
        </div>

        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <Label className="flex w-full max-w-56">Any Other Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes about staff member"
              value={formData.notes || ''}
              onChange={(e) => onFormChange('notes', e.target.value)}
              disabled={!canEdit}
              rows={4}
            />
          </div>
        </div>
      </CardContent>
    </Card>

    <DepartmentMasterDialog
      open={showDepartmentDialog}
      onClose={() => {
        setShowDepartmentDialog(false);
        setRefreshDepartmentKey(prev => prev + 1);
      }}
      onUpdate={() => {}}
    />

    <EmploymentTypeMasterDialog
      open={showEmploymentTypeDialog}
      onClose={() => {
        setShowEmploymentTypeDialog(false);
        setRefreshEmploymentTypeKey(prev => prev + 1);
      }}
      onUpdate={() => {}}
    />
    </>
  );
}
