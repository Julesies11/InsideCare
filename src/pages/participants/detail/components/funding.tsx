import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, DollarSign, Clock } from 'lucide-react';
import { FundingSourceCombobox } from './funding-components/funding-source-combobox';
import { FundingTypeCombobox } from './funding-components/funding-type-combobox';
import { FundingSourceMasterDialog } from './funding-components/funding-source-master-dialog';
import { FundingTypeMasterDialog } from './funding-components/funding-type-master-dialog';
import { useFunding } from '@/hooks/useFunding';
import { PendingChanges } from '@/models/pending-changes';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';

interface FundingProps {
  participantId?: string;
  canAdd: boolean;
  canDelete: boolean;
  pendingChanges?: PendingChanges;
  onPendingChangesChange?: (changes: PendingChanges) => void;
}

const fundingSchema = z.object({
  funding_source_id: z.string().min(1, 'Funding source is required'),
  funding_type_id: z.string().min(1, 'Funding type is required'),
  code: z.string().optional(),
  invoice_recipient: z.string().optional(),
  allocated_amount: z.number().min(0, 'Allocated amount must be positive').or(z.string().regex(/^\d+$/, 'Must be a valid number').transform(Number)),
  used_amount: z.number().min(0).default(0).or(z.string().regex(/^\d+$/, 'Must be a valid number').transform(Number)),
  status: z.enum(['Active', 'Near Depletion', 'Expired', 'Inactive']).default('Active'),
  end_date: z.string().optional(),
  notes: z.string().optional(),
});

type FundingFormValues = z.infer<typeof fundingSchema>;

export function Funding({ 
  participantId, 
  canAdd, 
  canDelete,
  pendingChanges,
  onPendingChangesChange 
}: FundingProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingFunding, setEditingFunding] = useState<any>(null);
  const [showFundingSourceMasterDialog, setShowFundingSourceMasterDialog] = useState(false);
  const [showFundingTypeMasterDialog, setShowFundingTypeMasterDialog] = useState(false);
  const [refreshFundingSourceKey, setRefreshFundingSourceKey] = useState(0);
  const [refreshFundingTypeKey, setRefreshFundingTypeKey] = useState(0);

  const { fundingRecords, loading } = useFunding(participantId);

  const form = useForm<FundingFormValues>({
    resolver: zodResolver(fundingSchema),
    defaultValues: {
      funding_source_id: '',
      funding_type_id: '',
      code: '',
      invoice_recipient: '',
      allocated_amount: 0,
      used_amount: 0,
      status: 'Active',
      end_date: '',
      notes: '',
    },
  });

  const allocatedAmount = form.watch('allocated_amount');
  const usedAmount = form.watch('used_amount');
  const remainingAmount = (allocatedAmount || 0) - (usedAmount || 0);

  useEffect(() => {
    if (showDialog && editingFunding) {
      form.reset({
        funding_source_id: editingFunding.funding_source_id,
        funding_type_id: editingFunding.funding_type_id,
        code: editingFunding.code || '',
        invoice_recipient: editingFunding.invoice_recipient || '',
        allocated_amount: editingFunding.allocated_amount,
        used_amount: editingFunding.used_amount,
        status: editingFunding.status,
        end_date: editingFunding.end_date || '',
        notes: editingFunding.notes || '',
      });
    } else if (showDialog) {
      form.reset({
        funding_source_id: '',
        funding_type_id: '',
        code: '',
        invoice_recipient: '',
        allocated_amount: 0,
        used_amount: 0,
        status: 'Active',
        end_date: '',
        notes: '',
      });
    }
  }, [showDialog, editingFunding, form]);

  const handleAdd = () => {
    setEditingFunding(null);
    setShowDialog(true);
  };

  const handleEdit = (funding: any) => {
    setEditingFunding(funding);
    setShowDialog(true);
  };

  const formatCurrencyInput = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    if (!numericValue) return '';
    return new Intl.NumberFormat('en-AU', { 
      style: 'currency', 
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(parseInt(numericValue));
  };

  const parseCurrencyInput = (value: string): number => {
    const numericValue = value.replace(/[^0-9]/g, '');
    return parseInt(numericValue) || 0;
  };

  const handleSave = (data: FundingFormValues) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const saveData = {
      ...data,
      remaining_amount: remainingAmount,
    };

    if (editingFunding) {
      if (editingFunding.tempId) {
        const newPending = {
          ...pendingChanges,
          funding: {
            ...pendingChanges.funding,
            toAdd: pendingChanges.funding.toAdd.map(fund =>
              fund.tempId === editingFunding.tempId ? { ...fund, ...saveData } : fund
            ),
          },
        };
        onPendingChangesChange(newPending);
      } else {
        const newPending = {
          ...pendingChanges,
          funding: {
            ...pendingChanges.funding,
            toUpdate: [
              ...pendingChanges.funding.toUpdate.filter(f => f.id !== editingFunding.id),
              { id: editingFunding.id, ...saveData },
            ],
          },
        };
        onPendingChangesChange(newPending);
      }
    } else {
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const newPending = {
        ...pendingChanges,
        funding: {
          ...pendingChanges.funding,
          toAdd: [
            ...pendingChanges.funding.toAdd,
            { tempId, ...saveData },
          ],
        },
      };
      onPendingChangesChange(newPending);
    }
    setShowDialog(false);
  };

  const handleDelete = (funding: any) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    if (funding.tempId) {
      handleCancelPendingAdd(funding.tempId);
      return;
    }

    if (confirm('Mark this funding record for deletion? It will be removed when you click Save Changes.')) {
      const newPending = {
        ...pendingChanges,
        funding: {
          ...pendingChanges.funding,
          toDelete: [...pendingChanges.funding.toDelete, funding.id],
        },
      };
      onPendingChangesChange(newPending);
    }
  };

  const handleCancelPendingAdd = (tempId: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const newPending = {
      ...pendingChanges,
      funding: {
        ...pendingChanges.funding,
        toAdd: pendingChanges.funding.toAdd.filter(fund => fund.tempId !== tempId),
      },
    };
    onPendingChangesChange(newPending);
  };

  const handleCancelPendingUpdate = (id: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const newPending = {
      ...pendingChanges,
      funding: {
        ...pendingChanges.funding,
        toUpdate: pendingChanges.funding.toUpdate.filter(fund => fund.id !== id),
      },
    };
    onPendingChangesChange(newPending);
  };

  const handleCancelPendingDelete = (id: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const newPending = {
      ...pendingChanges,
      funding: {
        ...pendingChanges.funding,
        toDelete: pendingChanges.funding.toDelete.filter(fundId => fundId !== id),
      },
    };
    onPendingChangesChange(newPending);
  };

  const visibleFunding = [
    ...fundingRecords.filter(fund => !pendingChanges?.funding.toDelete.includes(fund.id)),
    ...(pendingChanges?.funding.toAdd || []),
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', { 
      style: 'currency', 
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <>
      <Card className="pb-2.5" id="funding">
        <CardHeader>
          <CardTitle>Funding</CardTitle>
          <Button variant="secondary" size="sm" className="border border-gray-300" onClick={handleAdd} disabled={!participantId || !canAdd}>
            <Plus className="size-4 me-1.5" />
            Add Funding
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading funding records...</div>
          ) : visibleFunding.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No funding records</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Allocated</TableHead>
                  <TableHead>Used</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleFunding.map((funding) => {
                  const isPendingAdd = 'tempId' in funding;
                  const isPendingUpdate = pendingChanges?.funding.toUpdate.some(f => f.id === funding.id);
                  const isPendingDelete = pendingChanges?.funding.toDelete.includes(funding.id);
                  
                  return (
                    <TableRow 
                      key={funding.id || funding.tempId} 
                      className={
                        isPendingAdd ? 'bg-primary/5' : 
                        isPendingDelete ? 'opacity-50 bg-destructive/5' : 
                        isPendingUpdate ? 'bg-warning/5' : ''
                      }
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DollarSign className="size-4 text-muted-foreground" />
                          <span className={`font-medium ${isPendingDelete ? 'line-through' : ''}`}>
                            {funding.funding_source?.name || 'N/A'}
                          </span>
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
                      </TableCell>
                      <TableCell>{funding.funding_type?.name || 'N/A'}</TableCell>
                      <TableCell>{funding.code || 'N/A'}</TableCell>
                      <TableCell>{formatCurrency(funding.allocated_amount)}</TableCell>
                      <TableCell>{formatCurrency(funding.used_amount)}</TableCell>
                      <TableCell>{formatCurrency(funding.remaining_amount || 0)}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            funding.status === 'Active' ? 'success' : 
                            funding.status === 'Near Depletion' ? 'warning' : 
                            'secondary'
                          }
                        >
                          {funding.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{funding.end_date || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {!isPendingDelete && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(funding)}>
                                <Edit className="size-4" />
                              </Button>
                              {canDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive"
                                  onClick={() => handleDelete(funding)}
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
                              onClick={() => handleCancelPendingAdd(funding.tempId!)}
                            >
                              Remove
                            </Button>
                          )}
                          {isPendingUpdate && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelPendingUpdate(funding.id)}
                            >
                              Undo
                            </Button>
                          )}
                          {isPendingDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelPendingDelete(funding.id)}
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
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingFunding ? 'Edit Funding' : 'Add Funding'}</DialogTitle>
            <DialogDescription>
              {editingFunding
                ? 'Update funding details'
                : 'Add a new funding record for this participant'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="funding_source_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Funding Source *</FormLabel>
                    <FormControl>
                      <FundingSourceCombobox
                        value={field.value}
                        onChange={field.onChange}
                        canEdit={true}
                        onManageList={() => setShowFundingSourceMasterDialog(true)}
                        onRefresh={refreshFundingSourceKey > 0 ? () => {} : undefined}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="funding_type_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Funding Type *</FormLabel>
                    <FormControl>
                      <FundingTypeCombobox
                        value={field.value}
                        onChange={field.onChange}
                        canEdit={true}
                        onManageList={() => setShowFundingTypeMasterDialog(true)}
                        onRefresh={refreshFundingTypeKey > 0 ? () => {} : undefined}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., REG12345" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="invoice_recipient"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice Recipient</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., John Smith" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="allocated_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Allocated Amount *</FormLabel>
                      <FormControl>
                        <Input 
                          type="text"
                          inputMode="numeric"
                          value={field.value ? formatCurrencyInput(field.value.toString()) : ''}
                          onChange={(e) => {
                            const numericValue = parseCurrencyInput(e.target.value);
                            field.onChange(numericValue);
                          }}
                          placeholder="$0" 
                          className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="used_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Used Amount</FormLabel>
                      <FormControl>
                        <Input 
                          type="text"
                          inputMode="numeric"
                          value={field.value ? formatCurrencyInput(field.value.toString()) : ''}
                          onChange={(e) => {
                            const numericValue = parseCurrencyInput(e.target.value);
                            field.onChange(numericValue);
                          }}
                          placeholder="$0" 
                          className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormItem>
                  <FormLabel>Remaining Amount</FormLabel>
                  <FormControl>
                    <Input 
                      type="text"
                      value={formatCurrencyInput(remainingAmount.toString())}
                      disabled
                      className="bg-muted"
                    />
                  </FormControl>
                </FormItem>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Near Depletion">Near Depletion</SelectItem>
                          <SelectItem value="Expired">Expired</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={3}
                        placeholder="Additional notes about this funding"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">Save</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <FundingSourceMasterDialog
        open={showFundingSourceMasterDialog}
        onClose={() => {
          setShowFundingSourceMasterDialog(false);
          setRefreshFundingSourceKey(prev => prev + 1);
        }}
        onUpdate={() => {}}
      />

      <FundingTypeMasterDialog
        open={showFundingTypeMasterDialog}
        onClose={() => {
          setShowFundingTypeMasterDialog(false);
          setRefreshFundingTypeKey(prev => prev + 1);
        }}
        onUpdate={() => {}}
      />
    </>
  );
}
