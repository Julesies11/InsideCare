import { useState } from 'react';
import { Container } from '@/components/common/container';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Settings2 } from 'lucide-react';
import { LeaveTypeMasterDialog } from './components/leave-type-master-dialog';
import { useLeaveTypesMaster } from '@/hooks/use-leave-types-master';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function LeaveTypeMasterPage() {
  const [showManageDialog, setShowManageDialog] = useState(false);
  const { data: leaveTypes = [], isLoading: loading, refetch } = useLeaveTypesMaster();

  return (
    <Container>
      <div className="flex flex-col gap-5 lg:gap-7.5">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-bold leading-none text-gray-900 dark:text-gray-100">
              Leave Types Configuration
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage the master list of leave types available for staff requests.
            </p>
          </div>
          <Button onClick={() => setShowManageDialog(true)}>
            <Settings2 className="size-4 me-2" />
            Manage Master List
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Active Leave Types</CardTitle>
            <CardDescription>
              These types are currently visible to staff in the leave request form.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-10 text-center text-muted-foreground">Loading leave types...</div>
            ) : leaveTypes.filter(lt => lt.is_active).length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                No active leave types found. Click "Manage Master List" to add some.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Leave Type Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveTypes.filter(lt => lt.is_active).map((lt) => (
                    <TableRow key={lt.id}>
                      <TableCell className="font-medium">{lt.leave_type_name}</TableCell>
                      <TableCell>
                        <Badge variant="success">Active</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(lt.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <LeaveTypeMasterDialog
        open={showManageDialog}
        onClose={() => setShowManageDialog(false)}
        onUpdate={refetch}
      />
    </Container>
  );
}
