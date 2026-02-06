'use client';

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Edit, Trash2, DollarSign, TrendingUp, PieChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase';
import { ParticipantFunding } from '@/hooks/useFunding';
import { toast } from 'sonner';

export function FundingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [funding, setFunding] = useState<ParticipantFunding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFundingDetail();
  }, [id]);

  async function fetchFundingDetail() {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('participant_funding')
        .select(
          `
          id,
          participant_id,
          house_id,
          funding_source_id,
          funding_type_id,
          code,
          invoice_recipient,
          allocated_amount,
          used_amount,
          remaining_amount,
          status,
          end_date,
          notes,
          created_at,
          updated_at,
          participant:participants(id, name),
          house:houses(id, name),
          funding_source:funding_sources_master(id, name),
          funding_type:funding_types_master(id, name)
          `
        )
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Format the data
      const formattedFunding = {
        ...data,
        participant: Array.isArray(data.participant) ? data.participant[0] : data.participant,
        house: Array.isArray(data.house) ? data.house[0] : data.house,
        funding_source: Array.isArray(data.funding_source) ? data.funding_source[0] : data.funding_source,
        funding_type: Array.isArray(data.funding_type) ? data.funding_type[0] : data.funding_type,
      } as ParticipantFunding;

      setFunding(formattedFunding);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch funding details';
      console.error('Error fetching funding details:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this funding record?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('participant_funding')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Funding record deleted successfully');
      navigate('/participants/funding');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete funding record';
      toast.error(errorMessage);
    }
  };

  const handleEdit = () => {
    navigate(`/participants/funding/${id}/edit`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'success';
      case 'Near Depletion':
        return 'warning';
      case 'Expired':
        return 'secondary';
      case 'Inactive':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getUsagePercentage = (used: number, allocated: number) => {
    return Math.round((used / allocated) * 100);
  };

  if (loading) {
    return (
      <div className="grid gap-5 lg:gap-7.5">
        <Button variant="outline" onClick={() => navigate('/participants/funding')}>
          <ArrowLeft className="size-4 me-2" />
          Back to Funding
        </Button>
        <div className="p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">Loading funding details...</p>
        </div>
      </div>
    );
  }

  if (error || !funding) {
    return (
      <div className="grid gap-5 lg:gap-7.5">
        <Button variant="outline" onClick={() => navigate('/participants/funding')}>
          <ArrowLeft className="size-4 me-2" />
          Back to Funding
        </Button>
        <Alert variant="destructive">
          {error || 'Funding record not found'}
        </Alert>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:gap-7.5">
      {/* Back Button */}
      <Button variant="outline" onClick={() => navigate('/participants/funding')}>
        <ArrowLeft className="size-4 me-2" />
        Back to Funding
      </Button>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {funding.participant?.name || 'Funding Details'}
          </h1>
          <p className="text-sm text-gray-700 dark:text-gray-400">
            {funding.funding_source?.name} - {funding.funding_type?.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="size-4 me-2" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="size-4 me-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <DollarSign className="size-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Allocated</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  ${funding.allocated_amount.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <TrendingUp className="size-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Used</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  ${funding.used_amount.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <PieChart className="size-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Remaining</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  ${(funding.remaining_amount || 0).toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Utilization */}
      <Card>
        <CardHeader>
          <h3 className="text-base font-semibold leading-none tracking-tight">Budget Utilization</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Usage</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {getUsagePercentage(funding.used_amount, funding.allocated_amount)}%
              </span>
            </div>
            <Progress
              value={getUsagePercentage(funding.used_amount, funding.allocated_amount)}
              className="h-3"
            />
          </div>
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Allocated</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                ${funding.allocated_amount.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Used</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                ${funding.used_amount.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Remaining</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                ${(funding.remaining_amount || 0).toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Tabs */}
      <Tabs defaultValue="information" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="information">Information</TabsTrigger>
          <TabsTrigger value="claims">Claims</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="information" className="space-y-4">
          <Card>
            <CardHeader>
              <h3 className="text-base font-semibold leading-none tracking-tight">Funding Information</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Participant</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {funding.participant?.name || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">House</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {funding.house?.name || '-'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Funding Source</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      <Badge variant="outline" appearance="light">
                        {funding.funding_source?.name || 'N/A'}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Funding Type</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {funding.funding_type?.name || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Code</p>
                    <p className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">
                      {funding.code || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                    <Badge variant={getStatusColor(funding.status)} appearance="light">
                      {funding.status}
                    </Badge>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Invoice Recipient</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {funding.invoice_recipient}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">End Date</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {funding.end_date ? new Date(funding.end_date).toLocaleDateString() : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Created</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {funding.created_at ? new Date(funding.created_at).toLocaleDateString() : '-'}
                    </p>
                  </div>
                </div>

                {funding.notes && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Notes</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {funding.notes}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="claims" className="space-y-4">
          <Card>
            <CardHeader>
              <h3 className="text-base font-semibold leading-none tracking-tight">Funding Claims</h3>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-600 dark:text-gray-400 py-8">
                <p>No claims recorded yet</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <h3 className="text-base font-semibold leading-none tracking-tight">Linked Invoices</h3>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-600 dark:text-gray-400 py-8">
                <p>No invoices linked yet</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
