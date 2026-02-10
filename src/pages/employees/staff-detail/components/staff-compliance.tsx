import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ComplianceItem {
  id: string;
  label: string;
  checkboxField: string;
  expiryField: string;
}

interface StaffComplianceSectionProps {
  formData: any;
  onFormChange: (field: string, value: any) => void;
  canEdit: boolean;
}

const COMPLIANCE_ITEMS: ComplianceItem[] = [
  {
    id: 'ndis_worker_screening_check',
    label: 'NDIS Worker Screening Check',
    checkboxField: 'ndis_worker_screening_check',
    expiryField: 'ndis_worker_screening_check_expiry',
  },
  {
    id: 'ndis_orientation_module',
    label: 'NDIS Orientation Module',
    checkboxField: 'ndis_orientation_module',
    expiryField: 'ndis_orientation_module_expiry',
  },
  {
    id: 'ndis_code_of_conduct',
    label: 'NDIS Code of Conduct',
    checkboxField: 'ndis_code_of_conduct',
    expiryField: 'ndis_code_of_conduct_expiry',
  },
  {
    id: 'ndis_infection_control_training',
    label: 'NDIS Infection Control Training',
    checkboxField: 'ndis_infection_control_training',
    expiryField: 'ndis_infection_control_training_expiry',
  },
  {
    id: 'drivers_license',
    label: 'Drivers License',
    checkboxField: 'drivers_license',
    expiryField: 'drivers_license_expiry',
  },
  {
    id: 'comprehensive_car_insurance',
    label: 'Comprehensive Car Insurance',
    checkboxField: 'comprehensive_car_insurance',
    expiryField: 'comprehensive_car_insurance_expiry',
  },
];

export function StaffComplianceSection({ 
  formData,
  onFormChange,
  canEdit
}: StaffComplianceSectionProps) {

  const handleCheckboxChange = (field: string, checked: boolean) => {
    onFormChange(field, checked);
  };

  const handleExpiryChange = (field: string, value: string) => {
    onFormChange(field, value || null);
  };

  return (
    <Card className="pb-2.5" id="staff_compliance">
      <CardHeader>
        <CardTitle>Compliance</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-accent/60">
              <TableHead className="text-start text-secondary-foreground font-normal min-w-[250px] h-10">
                Requirement
              </TableHead>
              <TableHead className="min-w-24 text-secondary-foreground font-normal text-center h-10">
                Completed
              </TableHead>
              <TableHead className="min-w-[180px] text-secondary-foreground font-normal text-center h-10">
                Expiry Date
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-mono font-medium">
            {COMPLIANCE_ITEMS.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="py-5.5!">
                  {item.label}
                </TableCell>
                <TableCell className="py-5.5! text-center">
                  <Checkbox
                    id={item.checkboxField}
                    checked={formData[item.checkboxField] || false}
                    onCheckedChange={(checked) => handleCheckboxChange(item.checkboxField, checked as boolean)}
                    disabled={!canEdit}
                  />
                </TableCell>
                <TableCell className="py-5.5! text-center">
                  <Input
                    id={item.expiryField}
                    type="date"
                    value={formData[item.expiryField] || ''}
                    onChange={(e) => handleExpiryChange(item.expiryField, e.target.value)}
                    disabled={!canEdit}
                    className="max-w-[160px] mx-auto"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
