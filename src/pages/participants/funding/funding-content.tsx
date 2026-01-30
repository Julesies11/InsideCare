import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FundingTable } from './components/funding-table';
import { useNavigate } from 'react-router';
import { DollarSign } from 'lucide-react';

export function FundingContent() {
  const navigate = useNavigate();

  const handleAddFunding = () => {
    // TODO: Open dialog or navigate to add funding page
    navigate('/participants/funding/add');
  };

  return (
    <div className="grid gap-5 lg:gap-7.5">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Participant Funding
          </h1>
          <p className="text-sm text-gray-700 dark:text-gray-400">
            Manage funding records, budgets, and allocations
          </p>
        </div>
        <Button onClick={handleAddFunding}>
          <DollarSign className="size-4" />
          Add Funding Record
        </Button>
      </div>

      {/* Motivational Banner */}
      <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border-purple-200 dark:border-purple-800">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/50">
              <DollarSign className="size-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="text-base font-semibold text-purple-900 dark:text-purple-100">
                Maximizing Every Dollar
              </h3>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Strategic funding management ensures that every participant receives the support they need to thrive. 
                Your careful oversight makes their dreams achievable and sustainable.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Funding Table */}
      <FundingTable />
    </div>
  );
}
