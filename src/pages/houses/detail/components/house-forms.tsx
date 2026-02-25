import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, FileText, Clock, Calendar, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useHouseForms } from '@/hooks/useHouseForms';
import { useParticipants } from '@/hooks/use-participants';
import { useStaff } from '@/hooks/useStaff';
import { useAuth } from '@/auth/context/auth-context';
import { HousePendingChanges } from '@/models/house-pending-changes';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';

interface HouseFormsProps {
  houseId?: string;
  canAdd: boolean;
  canDelete: boolean;
  pendingChanges?: HousePendingChanges;
  onPendingChangesChange?: (changes: HousePendingChanges) => void;
}

const formSchema = z.object({
  name: z.string().min(1, 'Form name is required'),
  type: z.string().min(1, 'Form type is required'),
  description: z.string().optional(),
  frequency: z.string().min(1, 'Frequency is required'),
  is_global: z.boolean().default(false),
  status: z.string().default('active'),
});

type FormFormValues = z.infer<typeof formSchema>;

const assignmentSchema = z.object({
  participant_id: z.string().optional(),
  staff_id: z.string().optional(),
  due_date: z.string().optional(),
  status: z.string().default('pending'),
  notes: z.string().optional(),
});

type AssignmentFormValues = z.infer<typeof assignmentSchema>;

export function HouseForms({ 
  houseId, 
  canAdd, 
  canDelete,
  pendingChanges,
  onPendingChangesChange 
}: HouseFormsProps) {
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [editingForm, setEditingForm] = useState<any>(null);
  const [selectedForm, setSelectedForm] = useState<any>(null);
  const [editingAssignment, setEditingAssignment] = useState<any>(null);

  const { houseForms, loading } = useHouseForms(houseId);
  const { participants } = useParticipants();
  const { staff } = useStaff();
  const { user } = useAuth();

  const form = useForm<FormFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: '',
      description: '',
      frequency: 'monthly',
      is_global: false,
      status: 'active',
    },
  });

  const assignmentForm = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      participant_id: '',
      staff_id: '',
      due_date: '',
      status: 'pending',
      notes: '',
    },
  });

  useEffect(() => {
    if (showFormDialog && editingForm) {
      form.reset({
        name: editingForm.name,
        type: editingForm.type,
        description: editingForm.description || '',
        frequency: editingForm.frequency,
        is_global: editingForm.is_global || false,
        status: editingForm.status || 'active',
      });
    } else if (showFormDialog) {
      form.reset({
        name: '',
        type: '',
        description: '',
        frequency: 'monthly',
        is_global: false,
        status: 'active',
      });
    }
  }, [showFormDialog, editingForm, form]);

  useEffect(() => {
    if (showAssignmentDialog && editingAssignment) {
      assignmentForm.reset({
        participant_id: editingAssignment.participant_id || '',
        staff_id: editingAssignment.staff_id || '',
        due_date: editingAssignment.due_date || '',
        status: editingAssignment.status || 'pending',
        notes: editingAssignment.notes || '',
      });
    } else if (showAssignmentDialog) {
      assignmentForm.reset({
        participant_id: '',
        staff_id: '',
        due_date: '',
        status: 'pending',
        notes: '',
      });
    }
  }, [showAssignmentDialog, editingAssignment, assignmentForm]);

  const handleAddForm = () => {
    setEditingForm(null);
    setShowFormDialog(true);
  };

  const handleEditForm = (form: any) => {
    setEditingForm(form);
    setShowFormDialog(true);
  };

  const handleSaveForm = (data: FormFormValues) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const formData = {
      ...data,
      house_id: houseId,
      created_by: user?.id,
    };

    if (editingForm) {
      // Update existing form
      if (editingForm.tempId) {
        // Update pending add
        const newPending = {
          ...pendingChanges,
          forms: {
            ...pendingChanges.forms,
            toAdd: pendingChanges.forms.toAdd.map(form =>
              form.tempId === editingForm.tempId ? { ...form, ...formData } : form
            ),
          },
        };
        onPendingChangesChange(newPending);
      } else {
        // Add to pending updates
        const newPending = {
          ...pendingChanges,
          forms: {
            ...pendingChanges.forms,
            toUpdate: [
              ...pendingChanges.forms.toUpdate.filter(f => f.id !== editingForm.id),
              { id: editingForm.id, ...formData },
            ],
          },
        };
        onPendingChangesChange(newPending);
      }
    } else {
      // Add new form
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const newPending = {
        ...pendingChanges,
        forms: {
          ...pendingChanges.forms,
          toAdd: [
            ...pendingChanges.forms.toAdd,
            { tempId, ...formData },
          ],
        },
      };
      onPendingChangesChange(newPending);
    }
    setShowFormDialog(false);
  };

  const handleDeleteForm = (form: any) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    // If it's a pending add, just remove it from the pending adds list
    if (form.tempId) {
      handleCancelPendingFormAdd(form.tempId);
      return;
    }

    // Otherwise, mark existing form for deletion
    if (confirm('Mark this form for deletion? It will be removed when you click Save Changes.')) {
      const newPending = {
        ...pendingChanges,
        forms: {
          ...pendingChanges.forms,
          toDelete: [...pendingChanges.forms.toDelete, form.id],
        },
      };
      onPendingChangesChange(newPending);
    }
  };

  const handleAddAssignment = (form: any) => {
    setSelectedForm(form);
    setEditingAssignment(null);
    setShowAssignmentDialog(true);
  };

  const handleEditAssignment = (form: any, assignment: any) => {
    setSelectedForm(form);
    setEditingAssignment(assignment);
    setShowAssignmentDialog(true);
  };

  const handleSaveAssignment = (data: AssignmentFormValues) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const assignmentData = {
      ...data,
      form_id: selectedForm.id,
      assigned_by: user?.id,
    };

    if (editingAssignment) {
      // Update existing assignment
      if (editingAssignment.tempId) {
        // Update pending add
        const newPending = {
          ...pendingChanges,
          formAssignments: {
            ...pendingChanges.formAssignments,
            toAdd: pendingChanges.formAssignments.toAdd.map(assignment =>
              assignment.tempId === editingAssignment.tempId ? { ...assignment, ...assignmentData } : assignment
            ),
          },
        };
        onPendingChangesChange(newPending);
      } else {
        // Add to pending updates
        const newPending = {
          ...pendingChanges,
          formAssignments: {
            ...pendingChanges.formAssignments,
            toUpdate: [
              ...pendingChanges.formAssignments.toUpdate.filter(a => a.id !== editingAssignment.id),
              { id: editingAssignment.id, ...assignmentData },
            ],
          },
        };
        onPendingChangesChange(newPending);
      }
    } else {
      // Add new assignment
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const newPending = {
        ...pendingChanges,
        formAssignments: {
          ...pendingChanges.formAssignments,
          toAdd: [
            ...pendingChanges.formAssignments.toAdd,
            { tempId, ...assignmentData },
          ],
        },
      };
      onPendingChangesChange(newPending);
    }
    setShowAssignmentDialog(false);
  };

  const handleDeleteAssignment = (assignment: any) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    // If it's a pending add, just remove it from the pending adds list
    if (assignment.tempId) {
      handleCancelPendingAssignmentAdd(assignment.tempId);
      return;
    }

    // Otherwise, mark existing assignment for deletion
    if (confirm('Mark this assignment for deletion? It will be removed when you click Save Changes.')) {
      const newPending = {
        ...pendingChanges,
        formAssignments: {
          ...pendingChanges.formAssignments,
          toDelete: [...pendingChanges.formAssignments.toDelete, assignment.id],
        },
      };
      onPendingChangesChange(newPending);
    }
  };

  const handleCancelPendingFormAdd = (tempId: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const newPending = {
      ...pendingChanges,
      forms: {
        ...pendingChanges.forms,
        toAdd: pendingChanges.forms.toAdd.filter(form => form.tempId !== tempId),
      },
    };
    onPendingChangesChange(newPending);
  };

  const handleCancelPendingAssignmentAdd = (tempId: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const newPending = {
      ...pendingChanges,
      formAssignments: {
        ...pendingChanges.formAssignments,
        toAdd: pendingChanges.formAssignments.toAdd.filter(assignment => assignment.tempId !== tempId),
      },
    };
    onPendingChangesChange(newPending);
  };

  // Combine existing forms with pending adds, filter out pending deletes
  const visibleForms = [
    ...houseForms.filter(form => !pendingChanges?.forms.toDelete.includes(form.id)),
    ...(pendingChanges?.forms.toAdd || []),
  ];

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'secondary';
      case 'archived': return 'destructive';
      default: return 'secondary';
    }
  };

  // Get assignment status color
  const getAssignmentStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'overdue': return 'destructive';
      case 'cancelled': return 'secondary';
      default: return 'secondary';
    }
  };

  // Get assignment status icon
  const getAssignmentStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="size-4" />;
      case 'pending': return <Clock className="size-4" />;
      case 'overdue': return <AlertCircle className="size-4" />;
      case 'cancelled': return <XCircle className="size-4" />;
      default: return <Clock className="size-4" />;
    }
  };

  return (
    <>
      <Card className="pb-2.5" id="forms">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            Forms
          </CardTitle>
          <Button variant="secondary" size="sm" className="border border-gray-300" onClick={handleAddForm} disabled={!houseId || !canAdd}>
            <Plus className="size-4 me-1.5" />
            Add Form
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading forms...</div>
          ) : visibleForms.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="flex flex-col items-center gap-2">
                <FileText className="size-12 text-muted-foreground opacity-50" />
                <p>No forms created yet</p>
                <p className="text-sm">Create forms to track required documentation and compliance</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleForms.map((form) => {
                const isPendingAdd = 'tempId' in form;
                const isPendingUpdate = pendingChanges?.forms.toUpdate.some(f => f.id === form.id);
                const isPendingDelete = pendingChanges?.forms.toDelete.includes(form.id);
                const assignments = form.assignments || [];

                return (
                  <Card key={form.id || form.tempId} className={`border ${
                      isPendingAdd ? 'bg-primary/5 border-primary/20' :
                      isPendingDelete ? 'opacity-50 bg-destructive/5 border-destructive/20' :
                      isPendingUpdate ? 'bg-warning/5 border-warning/20' : ''
                    }`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className={`text-base font-semibold ${isPendingDelete ? 'line-through' : ''}`}>
                              {form.name}
                            </h3>
                            {form.is_global && (
                              <Badge variant="outline" className="text-xs border-blue-500 text-blue-700">
                                Global
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {form.type}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {form.frequency}
                            </Badge>
                            <Badge variant={getStatusColor(form.status)} className="text-xs">
                              {form.status}
                            </Badge>
                            {isPendingAdd && (
                              <span className="text-xs text-primary flex items-center gap-1">
                                <Clock className="size-3" />
                                Pending add
                              </span>
                            )}
                            {isPendingUpdate && (
                              <span className="text-xs text-warning flex items-center gap-1">
                                <Clock className="size-3" />
                                Pending update
                              </span>
                            )}
                            {isPendingDelete && (
                              <span className="text-xs text-destructive flex items-center gap-1">
                                <Clock className="size-3" />
                                Pending deletion
                              </span>
                            )}
                          </div>
                          {form.description && (
                            <p className="text-sm text-muted-foreground">{form.description}</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {!isPendingDelete && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => handleEditForm(form)}>
                                <Edit className="size-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleAddAssignment(form)}>
                                <Plus className="size-4" />
                              </Button>
                              {canDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive"
                                  onClick={() => handleDeleteForm(form)}
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              )}
                            </>
                          )}
                          {isPendingAdd && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelPendingFormAdd(form.tempId!)}
                            >
                              Remove
                            </Button>
                          )}
                          {isPendingUpdate && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelPendingFormAdd(form.id)}
                            >
                              Undo
                            </Button>
                          )}
                          {isPendingDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelPendingFormAdd(form.id)}
                            >
                              Undo
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {assignments.length === 0 ? (
                          <div className="text-center py-4 text-muted-foreground text-sm">
                            No assignments for this form
                          </div>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Assigned To</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Notes</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {assignments.map((assignment) => {
                                const isAssignmentPendingAdd = 'tempId' in assignment;
                                const isAssignmentPendingUpdate = pendingChanges?.formAssignments.toUpdate.some(a => a.id === assignment.id);
                                const isAssignmentPendingDelete = pendingChanges?.formAssignments.toDelete.includes(assignment.id);
                                const assignedTo = assignment.participant?.name || assignment.staff?.name || 'Unknown';
                                const assignedType = assignment.participant ? 'Participant' : 'Staff';

                                return (
                                  <TableRow key={assignment.id || assignment.tempId} className={
                                    isAssignmentPendingAdd ? 'bg-primary/5' :
                                    isAssignmentPendingDelete ? 'opacity-50 bg-destructive/5' :
                                    isAssignmentPendingUpdate ? 'bg-warning/5' : ''
                                  }>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <User className="size-4 text-muted-foreground" />
                                        <div>
                                          <div className={`text-sm font-medium ${isAssignmentPendingDelete ? 'line-through' : ''}`}>
                                            {assignedTo}
                                          </div>
                                          <div className="text-xs text-muted-foreground">{assignedType}</div>
                                        </div>
                                        {isAssignmentPendingAdd && (
                                          <span className="text-xs text-primary flex items-center gap-1">
                                            <Clock className="size-3" />
                                            Pending add
                                          </span>
                                        )}
                                        {isAssignmentPendingUpdate && (
                                          <span className="text-xs text-warning flex items-center gap-1">
                                            <Clock className="size-3" />
                                            Pending update
                                          </span>
                                        )}
                                        {isAssignmentPendingDelete && (
                                          <span className="text-xs text-destructive flex items-center gap-1">
                                            <Clock className="size-3" />
                                            Pending deletion
                                          </span>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="size-4 text-muted-foreground" />
                                        {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'No due date'}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        {getAssignmentStatusIcon(assignment.status)}
                                        <Badge variant={getAssignmentStatusColor(assignment.status)} className="text-xs">
                                          {assignment.status}
                                        </Badge>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="text-sm text-muted-foreground max-w-xs truncate">
                                        {assignment.notes || 'No notes'}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex justify-end gap-1">
                                        {!isAssignmentPendingDelete && (
                                          <>
                                            <Button variant="ghost" size="sm" onClick={() => handleEditAssignment(form, assignment)}>
                                              <Edit className="size-4" />
                                            </Button>
                                            {canDelete && (
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive"
                                                onClick={() => handleDeleteAssignment(assignment)}
                                              >
                                                <Trash2 className="size-4" />
                                              </Button>
                                            )}
                                          </>
                                        )}
                                        {isAssignmentPendingAdd && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteAssignment(assignment)}
                                          >
                                            Remove
                                          </Button>
                                        )}
                                        {isAssignmentPendingUpdate && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteAssignment(assignment)}
                                          >
                                            Undo
                                          </Button>
                                        )}
                                        {isAssignmentPendingDelete && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteAssignment(assignment)}
                                          >
                                            Undo
                                          </Button>
                                        )}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingForm ? 'Edit Form' : 'Add Form'}</DialogTitle>
            <DialogDescription>
              {editingForm
                ? 'Update form details'
                : 'Create a new form for this house'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSaveForm)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Form Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter form name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Form Type *</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select form type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="medical">Medical</SelectItem>
                          <SelectItem value="consent">Consent</SelectItem>
                          <SelectItem value="assessment">Assessment</SelectItem>
                          <SelectItem value="incident">Incident Report</SelectItem>
                          <SelectItem value="progress">Progress Note</SelectItem>
                          <SelectItem value="compliance">Compliance</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Describe the purpose of this form" rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency *</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                          <SelectItem value="as_needed">As Needed</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="is_global"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel>Global Form</FormLabel>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowFormDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">Save</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Assignment Dialog */}
      <Dialog open={showAssignmentDialog} onOpenChange={setShowAssignmentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAssignment ? 'Edit Assignment' : 'Add Assignment'}</DialogTitle>
            <DialogDescription>
              {editingAssignment
                ? 'Update assignment details'
                : 'Assign this form to a participant or staff member'}
            </DialogDescription>
          </DialogHeader>
          <Form {...assignmentForm}>
            <form onSubmit={assignmentForm.handleSubmit(handleSaveAssignment)} className="space-y-4 py-4">
              <FormField
                control={assignmentForm.control}
                name="participant_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Participant</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select participant" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {participants.map((participant) => (
                            <SelectItem key={participant.id} value={participant.id}>
                              {participant.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={assignmentForm.control}
                name="staff_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Staff Member</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select staff member" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {staff.map((staffMember) => (
                            <SelectItem key={staffMember.id} value={staffMember.id}>
                              {staffMember.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={assignmentForm.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={assignmentForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={assignmentForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Add any notes about this assignment" rows={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAssignmentDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">Save</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
