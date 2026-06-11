import { ExternalLink } from 'lucide-react';
import { Link } from 'react-router';
import { useStaffByRole } from '@/hooks/use-staff';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface RoleStaffListDialogProps {
  roleId: string | null;
  roleName: string | null;
  onClose: () => void;
}

export function RoleStaffListDialog({
  roleId,
  roleName,
  onClose,
}: RoleStaffListDialogProps) {
  const { staff, loading } = useStaffByRole(roleId || undefined);

  return (
    <Dialog open={!!roleId} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>
            Staff Assigned to <span className="text-primary">{roleName}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6 mt-4">
          {loading ? (
            <div className="py-10 text-center text-gray-500">
              Loading assigned staff...
            </div>
          ) : staff.length === 0 ? (
            <div className="py-10 text-center text-gray-500 italic border rounded-lg bg-gray-50">
              No staff members are currently assigned to this role.
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="font-bold">Name</TableHead>
                    <TableHead className="font-bold">Department</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((member) => (
                    <TableRow key={member.id} className="hover:bg-gray-50/30">
                      <TableCell className="py-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900">
                            {member.staff_name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {member.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        {member.department_info?.department_name || '-'}
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge
                          variant={
                            member.status === 'active' ? 'success' : 'secondary'
                          }
                          className="capitalize"
                        >
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <Link
                          to={`/employees/staff-detail/${member.id}`}
                          className="text-gray-400 hover:text-primary transition-colors"
                          title="View Profile"
                        >
                          <ExternalLink className="size-4" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
