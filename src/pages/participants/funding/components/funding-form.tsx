'use client';

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FundingSourceCombobox } from '@/pages/participants/detail/components/funding-components/funding-source-combobox';
import { FundingTypeCombobox } from '@/pages/participants/detail/components/funding-components/funding-type-combobox';
import { FundingSourceMasterDialog } from '@/pages/participants/detail/components/funding-components/funding-source-master-dialog';
import { FundingTypeMasterDialog } from '@/pages/participants/detail/components/funding-components/funding-type-master-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Alert } from '@/components/ui/alert';
import { useParticipants } from '@/hooks/use-participants';
import { useHouses } from '@/hooks/use-houses';
import { useFunding } from '@/hooks/useFunding';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function FundingForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { participants } = useParticipants();
  const { houses } = useHouses();
  const { fundingRecords } = useFunding();

  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFundingSourceMasterDialog, setShowFundingSourceMasterDialog] = useState(false);
  const [showFundingTypeMasterDialog, setShowFundingTypeMasterDialog] = useState(false);
  const [refreshFundingSourceKey, setRefreshFundingSourceKey] = useState(0);
  const [refreshFundingTypeKey, setRefreshFundingTypeKey] = useState(0);

  const [formData, setFormData] = useState({
    participant_id: '',
    house_id: '',
    funding_source_id: '',
    funding_type_id: '',
    code: '',
    invoice_recipient: '',
    allocated_amount: '',
    used_amount: '',
    status: 'Active' as 'Active' | 'Near Depletion' | 'Expired' | 'Inactive',
    end_date: '',
    notes: '',
  });

  useEffect(() => {
    if (id) {
      const funding = fundingRecords.find(f => f.id === id);
      if (funding) {
        setFormData({
          participant_id: funding.participant_id,
          house_id: funding.house_id ? funding.house_id : 'none',
          funding_source_id: funding.funding_source_id,
          funding_type_id: funding.funding_type_id,
          code: funding.code || '',
          invoice_recipient: funding.invoice_recipient || '',
          allocated_amount: funding.allocated_amount.toString(),
          used_amount: funding.used_amount.toString(),
          status: funding.status,
          end_date: funding.end_date || '',
          notes: funding.notes || '',
        });
        setLoading(false);
      }
    }
  }, [id, fundingRecords]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const calculateRemaining = () => {
    const allocated = parseFloat(formData.allocated_amount) || 0;
    const used = parseFloat(formData.used_amount) || 0;
    return Math.max(0, allocated - used);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', { 
      style: 'currency', 
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.participant_id || !formData.allocated_amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      const allocated = parseFloat(formData.allocated_amount);
      const used = parseFloat(formData.used_amount) || 0;
      const remaining = calculateRemaining();

      const data = {
        participant_id: formData.participant_id,
        house_id: formData.house_id === 'none' ? null : formData.house_id,
        funding_source_id: formData.funding_source_id,
        funding_type_id: formData.funding_type_id,
        code: formData.code || null,
        invoice_recipient: formData.invoice_recipient || null,
        allocated_amount: allocated,
        used_amount: used,
        remaining_amount: remaining,
        status: formData.status,
        end_date: formData.end_date || null,
        notes: formData.notes || null,
      };

      if (id) {
        // Update existing
        const { error } = await supabase
          .from('participant_funding')
          .update(data)
          .eq('id', id);

        if (error) throw error;
        toast.success('Funding record updated successfully');
      } else {
        // Create new
        const { error } = await supabase
          .from('participant_funding')
          .insert([data]);

        if (error) throw error;
        toast.success('Funding record created successfully');
      }

      navigate('/participants/funding');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save funding record';
      console.error('Error saving funding record:', err);
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-5 lg:gap-7.5">
      {/* Back Button */}
      <Button variant="outline" onClick={() => navigate('/participants/funding')}>
        <ArrowLeft className="size-4 me-2" />
        Back to Funding
      </Button>

      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {id ? 'Edit Funding Record' : 'Add Funding Record'}
        </h1>
        <p className="text-sm text-gray-700 dark:text-gray-400">
          {id ? 'Update the funding details below' : 'Create a new funding record for a participant'}
        </p>
      </div>

      {error && <Alert variant="destructive">{error}</Alert>}

      {/* Form */}
      <Card>
        <CardHeader>
          <h3 className="text-base font-semibold leading-none tracking-tight">Funding Details</h3>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* First Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="participant_id">Participant *</Label>
                <Select
                  value={formData.participant_id}
                  onValueChange={(value) => handleSelectChange('participant_id', value)}
                >
                  <SelectTrigger id="participant_id">
                    <SelectValue placeholder="Select a participant" />
                  </SelectTrigger>
                  <SelectContent>
                    {participants.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="house_id">House</Label>
                <Select
                  value={formData.house_id}
                  onValueChange={(value) => handleSelectChange('house_id', value)}
                >
                  <SelectTrigger id="house_id">
                    <SelectValue placeholder="Select a house" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {houses.map(h => (
                      <SelectItem key={h.id} value={h.id}>
                        {h.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="funding_source_id">Funding Source *</Label>
                <FundingSourceCombobox
                  value={formData.funding_source_id}
                  onChange={(value) => handleSelectChange('funding_source_id', value)}
                  canEdit={true}
                  onManageList={() => setShowFundingSourceMasterDialog(true)}
                  onRefresh={refreshFundingSourceKey > 0 ? () => {} : undefined}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="funding_type_id">Funding Type *</Label>
                <FundingTypeCombobox
                  value={formData.funding_type_id}
                  onChange={(value) => handleSelectChange('funding_type_id', value)}
                  canEdit={true}
                  onManageList={() => setShowFundingTypeMasterDialog(true)}
                  onRefresh={refreshFundingTypeKey > 0 ? () => {} : undefined}
                />
              </div>
            </div>

            {/* Third Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  name="code"
                  placeholder="e.g., NDIS-2024-001"
                  value={formData.code}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoice_recipient">Invoice Recipient *</Label>
                <Input
                  id="invoice_recipient"
                  name="invoice_recipient"
                  placeholder="Enter invoice recipient name"
                  value={formData.invoice_recipient}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Fourth Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="allocated_amount">Allocated Amount *</Label>
                <Input
                  id="allocated_amount"
                  name="allocated_amount"
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={formData.allocated_amount}
                  onChange={(e) => handleAmountChange(e, 'allocated_amount')}
                />
                {formData.allocated_amount && (
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(Number(formData.allocated_amount))}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="used_amount">Used Amount</Label>
                <Input
                  id="used_amount"
                  name="used_amount"
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={formData.used_amount}
                  onChange={(e) => handleAmountChange(e, 'used_amount')}
                />
                {formData.used_amount && (
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(Number(formData.used_amount))}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="remaining">Remaining Amount</Label>
                <Input
                  id="remaining"
                  type="text"
                  disabled
                  value={formatCurrency(calculateRemaining())}
                  className="bg-gray-100 dark:bg-gray-800"
                />
              </div>
            </div>

            {/* Fifth Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange('status', value)}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Near Depletion">Near Depletion</SelectItem>
                    <SelectItem value="Expired">Expired</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  name="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Add any additional notes..."
                value={formData.notes}
                onChange={handleInputChange}
                rows={4}
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-6">
              <Button
                variant="outline"
                onClick={() => navigate('/participants/funding')}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving || loading}
              >
                <Save className="size-4 me-2" />
                {saving ? 'Saving...' : 'Save Funding Record'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Master Dialogs */}
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
    </div>
  );
}
