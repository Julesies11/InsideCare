import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EmploymentDetailsProps {
  formData: any;
  onFormChange: (field: string, value: any) => void;
  canEdit: boolean;
}

export function EmploymentDetails({
  formData,
  onFormChange,
  canEdit,
}: EmploymentDetailsProps) {
  return (
    <Card className="pb-2.5" id="employment_details">
      <CardHeader>
        <CardTitle>Employment Details</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <Label className="flex w-full max-w-56">Department</Label>
            <Input
              id="department"
              placeholder="Department name"
              value={formData.department || ''}
              onChange={(e) => onFormChange('department', e.target.value)}
              disabled={!canEdit}
            />
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <Label className="flex w-full max-w-56">Employment Type</Label>
          <div className="grow">
            <Select 
              value={formData.employment_type || ''} 
              onValueChange={(value) => onFormChange('employment_type', value)}
              disabled={!canEdit}
            >
              <SelectTrigger id="employment_type">
                <SelectValue placeholder="Select employment type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full-time">Full-time</SelectItem>
                <SelectItem value="part-time">Part-time</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="temporary">Temporary</SelectItem>
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
            <Label className="flex w-full max-w-56">Working Hours</Label>
            <Input
              id="working_hours"
              placeholder="e.g., 9:00 AM - 5:00 PM"
              value={formData.working_hours || ''}
              onChange={(e) => onFormChange('working_hours', e.target.value)}
              disabled={!canEdit}
            />
          </div>
        </div>

        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <Label className="flex w-full max-w-56">Qualifications</Label>
            <Textarea
              id="qualifications"
              placeholder="Educational qualifications"
              value={formData.qualifications || ''}
              onChange={(e) => onFormChange('qualifications', e.target.value)}
              disabled={!canEdit}
              rows={3}
            />
          </div>
        </div>

        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <Label className="flex w-full max-w-56">Certifications</Label>
            <Textarea
              id="certifications"
              placeholder="Professional certifications"
              value={formData.certifications || ''}
              onChange={(e) => onFormChange('certifications', e.target.value)}
              disabled={!canEdit}
              rows={3}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
