'use client';

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

  const [formData, setFormData] = useState({
    participant_id: '',
    house_id: '',
    funding_source: 'NDIS' as 'NDIS' | 'Private' | 'State Funding',
    funding_type: 'Core Supports' as 'Core Supports' | 'Capacity Building' | 'Capital Supports' | 'Support Services',
    registration_number: '',
    invoice_recipient: '',
    allocated_amount: '',
    used_amount: '',
    status: 'Active' as 'Active' | 'Near Depletion' | 'Expired' | 'Inactive',
    expiry_date: '',
    notes: '',
  });

  useEffect(() => {
    if (id) {
      const funding = fundingRecords.find(f => f.id === id);
      if (funding) {
        setFormData({
          participant_id: funding.participant_id,
          house_id: funding.house_id ? funding.house_id : 'none',
          funding_source: funding.funding_source,
          funding_type: funding.funding_type,
          registration_number: funding.registration_number,
          invoice_recipient: funding.invoice_recipient,
          allocated_amount: funding.allocated_amount.toString(),
          used_amount: funding.used_amount.toString(),
          status: funding.status,
          expiry_date: funding.expiry_date || '',
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
        ...formData,
        house_id: formData.house_id === 'none' ? null : formData.house_id,
        allocated_amount: allocated,
        used_amount: used,
        remaining_amount: remaining,
        expiry_date: formData.expiry_date || null,
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
                <Label htmlFor="funding_source">Funding Source *</Label>
                <Select
                  value={formData.funding_source}
                  onValueChange={(value) => handleSelectChange('funding_source', value)}
                >
                  <SelectTrigger id="funding_source">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NDIS">NDIS</SelectItem>
                    <SelectItem value="Private">Private</SelectItem>
                    <SelectItem value="State Funding">State Funding</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="funding_type">Funding Type *</Label>
                <Select
                  value={formData.funding_type}
                  onValueChange={(value) => handleSelectChange('funding_type', value)}
                >
                  <SelectTrigger id="funding_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Core Supports">Core Supports</SelectItem>
                    <SelectItem value="Capacity Building">Capacity Building</SelectItem>
                    <SelectItem value="Capital Supports">Capital Supports</SelectItem>
                    <SelectItem value="Support Services">Support Services</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Third Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="registration_number">Registration Number *</Label>
                <Input
                  id="registration_number"
                  name="registration_number"
                  placeholder="e.g., NDIS-2024-001"
                  value={formData.registration_number}
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
                <Label htmlFor="allocated_amount">Allocated Amount * ($)</Label>
                <Input
                  id="allocated_amount"
                  name="allocated_amount"
                  type="number"
                  placeholder="0.00"
                  value={formData.allocated_amount}
                  onChange={handleInputChange}
                  step="0.01"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="used_amount">Used Amount ($)</Label>
                <Input
                  id="used_amount"
                  name="used_amount"
                  type="number"
                  placeholder="0.00"
                  value={formData.used_amount}
                  onChange={handleInputChange}
                  step="0.01"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="remaining">Remaining Amount ($)</Label>
                <Input
                  id="remaining"
                  type="number"
                  disabled
                  value={calculateRemaining().toFixed(2)}
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
                <Label htmlFor="expiry_date">Expiry Date</Label>
                <Input
                  id="expiry_date"
                  name="expiry_date"
                  type="date"
                  value={formData.expiry_date}
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
    </div>
  );
}
