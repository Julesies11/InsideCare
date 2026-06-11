import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/auth/context/auth-context';
import { format } from 'date-fns';
import {
  ArrowLeft,
  ClipboardCheck,
  Filter,
  Loader2,
  Printer,
  X,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { ROUTES } from '@/config/routes.config';
import { cn } from '@/lib/utils';
import { useHousesLightweight } from '@/hooks/use-houses';
import {
  useReportPreferences,
  useSaveReportPreferences,
} from '@/hooks/use-report-preferences';
import {
  useOnboardingMonitoring,
  useStaffLightweight,
} from '@/hooks/use-staff';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Container } from '@/components/common/container';
import { PrintableReport } from '@/components/common/printable-report';

export function OnboardingReportPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    preferences,
    isLoading: isLoadingPreferences,
    isSuccess,
  } = useReportPreferences(user?.staff_id, 'onboarding_monitoring');
  const savePreference = useSaveReportPreferences();

  const [criteria, setCriteria] = useState({
    houseId: 'all',
    staffId: 'all',
    actionableOnly: true,
    groupBy: 'staff' as 'staff' | 'task',
  });

  const [prefLoaded, setPrefLoaded] = useState(false);

  useEffect(() => {
    if (isSuccess && !prefLoaded) {
      if (preferences && preferences.criteria) {
        setCriteria((prev) => ({
          ...prev,
          ...preferences.criteria,
        }));
      }
      setPrefLoaded(true);
    }
  }, [isSuccess, preferences, prefLoaded]);

  const updateCriteria = (updates: Partial<typeof criteria>) => {
    const newCriteria = { ...criteria, ...updates };
    setCriteria(newCriteria);
    if (user?.staff_id) {
      savePreference.mutate({
        staffId: user.staff_id,
        reportType: 'onboarding_monitoring',
        criteria: newCriteria,
      });
    }
  };

  const { data: houses = [], loading: isLoadingHouses } =
    useHousesLightweight();
  const { data: staffList = [], isLoading: isLoadingStaff } =
    useStaffLightweight();

  // Fetch all records for the report (pageSize 5000)
  const { data: allItems = [], loading: isLoadingItems } =
    useOnboardingMonitoring({
      page: 1,
      pageSize: 5000,
      sortBy: 'staff_name',
      sortOrder: 'asc',
      statusFilter: criteria.actionableOnly ? ['Pending'] : [],
    });

  const filteredItems = useMemo(() => {
    let filtered = allItems;

    // Filter by House
    if (criteria.houseId !== 'all') {
      const houseName = houses.find(
        (h: any) => h.id === criteria.houseId,
      )?.house_name;
      filtered = filtered.filter(
        (item) =>
          item.assigned_houses &&
          item.assigned_houses.some((h: string) => h === houseName),
      );
    }

    // Filter by Staff Member
    if (criteria.staffId !== 'all') {
      filtered = filtered.filter((item) => item.staff_id === criteria.staffId);
    }

    return filtered;
  }, [allItems, criteria.houseId, criteria.staffId, houses]);

  const groupedData = useMemo(() => {
    const groups: Record<string, typeof filteredItems> = {};

    filteredItems.forEach((item) => {
      if (criteria.groupBy === 'staff') {
        const key = item.staff_name;
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
      } else if (criteria.groupBy === 'task') {
        const key = item.item_name;
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
      }
    });

    const sortedKeys = Object.keys(groups).sort();
    const sortedGroups: Record<string, typeof filteredItems> = {};
    sortedKeys.forEach((k) => {
      sortedGroups[k] = groups[k];
    });
    return sortedGroups;
  }, [filteredItems, criteria.groupBy]);

  const kpis = useMemo(() => {
    return {
      total: filteredItems.length,
      complete: filteredItems.filter((r) => r.is_complete).length,
      pending: filteredItems.filter((r) => !r.is_complete).length,
    };
  }, [filteredItems]);

  const handlePrint = () => {
    window.print();
  };

  const isDataLoading =
    isLoadingItems || isLoadingHouses || isLoadingPreferences;

  return (
    <Container className="pt-2 pb-6 max-w-full lg:px-10 text-gray-900">
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Criteria (hidden on print) */}
          <div className="lg:col-span-3 space-y-4 no-print">
            <div className="sticky top-6 space-y-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(ROUTES.REPORTING)}
                className="w-fit transition-colors hover:bg-gray-100"
              >
                <ArrowLeft className="size-4 me-1.5" />
                Back to Reports
              </Button>

              <Card className="shadow-sm border-gray-200">
                <CardHeader className="border-b border-gray-100 pb-4">
                  <CardTitle className="text-base flex items-center gap-2 font-sans font-bold">
                    <Filter className="size-4 text-primary" /> Report Criteria
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  {/* House Filter */}
                  <div className="space-y-2 flex flex-col">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest font-sans">
                      Filter by House
                    </label>
                    <Select
                      value={criteria.houseId}
                      onValueChange={(val) => updateCriteria({ houseId: val })}
                      disabled={isLoadingHouses}
                    >
                      <SelectTrigger className="h-10 text-xs font-sans">
                        <SelectValue placeholder="All Houses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          value="all"
                          className="text-xs font-semibold"
                        >
                          All Houses
                        </SelectItem>
                        {houses.map((h: any) => (
                          <SelectItem
                            key={h.id}
                            value={h.id}
                            className="text-xs"
                          >
                            {h.house_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Staff Filter */}
                  <div className="space-y-2 flex flex-col">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest font-sans">
                      Filter by Staff Member
                    </label>
                    <Select
                      value={criteria.staffId}
                      onValueChange={(val) => updateCriteria({ staffId: val })}
                      disabled={isLoadingStaff}
                    >
                      <SelectTrigger className="h-10 text-xs font-sans">
                        <SelectValue placeholder="All Staff" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          value="all"
                          className="text-xs font-semibold"
                        >
                          All Staff
                        </SelectItem>
                        {staffList
                          .filter((s: any) => s.status === 'active')
                          .map((s: any) => (
                            <SelectItem
                              key={s.id}
                              value={s.id}
                              className="text-xs"
                            >
                              {s.staff_name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Group By Filter */}
                  <div className="space-y-2 flex flex-col">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest font-sans">
                      Group Results By
                    </label>
                    <Select
                      value={criteria.groupBy}
                      onValueChange={(val: any) =>
                        updateCriteria({ groupBy: val })
                      }
                    >
                      <SelectTrigger className="h-10 text-xs font-sans">
                        <SelectValue placeholder="Group by..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="staff" className="text-xs">
                          Staff Member
                        </SelectItem>
                        <SelectItem value="task" className="text-xs">
                          Onboarding Task
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Options */}
                  <div className="space-y-3 pt-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest font-sans block mb-1">
                      Options
                    </label>
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2.5">
                        <Checkbox
                          id="opt-actionable"
                          checked={criteria.actionableOnly}
                          onCheckedChange={(checked) =>
                            updateCriteria({ actionableOnly: checked === true })
                          }
                        />
                        <Label
                          htmlFor="opt-actionable"
                          className="text-xs font-normal cursor-pointer text-rose-700 font-bold"
                        >
                          Show Pending Only (Gaps)
                        </Label>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
                    <Button
                      variant="primary"
                      onClick={handlePrint}
                      disabled={isDataLoading}
                      className="w-full font-bold shadow-sm"
                    >
                      <Printer className="size-4 me-2" />
                      Print Preview
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full text-xs text-gray-500 hover:text-primary font-sans transition-colors"
                      onClick={() =>
                        updateCriteria({
                          houseId: 'all',
                          staffId: 'all',
                          actionableOnly: true,
                          groupBy: 'staff',
                        })
                      }
                    >
                      <X className="size-3 me-2" />
                      Reset Criteria
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="bg-emerald-50/50 rounded-xl p-6 border border-emerald-100/50">
                <h4 className="text-emerald-900 font-bold text-sm mb-2 font-sans flex items-center gap-2">
                  <ClipboardCheck className="size-4" /> Focus on Readiness
                </h4>
                <p className="text-emerald-700/70 text-xs leading-relaxed font-sans">
                  By default, this report shows pending onboarding tasks to
                  highlight gaps in staff orientation and profile setup.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Live Report Preview */}
          <div className="lg:col-span-9 bg-gray-100/50 rounded-2xl border border-gray-200 min-h-[1000px] flex flex-col items-center py-4 px-4 overflow-hidden relative shadow-inner print:bg-transparent print:border-none print:shadow-none print:p-0">
            {isDataLoading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="size-8 animate-spin text-primary" />
                  <span className="text-sm font-bold text-gray-500 uppercase tracking-widest font-sans">
                    Generating Report...
                  </span>
                </div>
              </div>
            )}

            <div className="w-full max-w-[210mm] print:m-0 print:p-0">
              <PrintableReport
                title="Onboarding Audit Report"
                subtitle="InsideCare Organisational Audit"
                parameters={{
                  Date: format(new Date(), 'dd MMMM yyyy HH:mm'),
                  'House Filter':
                    criteria.houseId === 'all'
                      ? 'All Houses'
                      : houses?.find((h: any) => h.id === criteria.houseId)
                          ?.house_name || 'All Houses',
                  'Staff Filter':
                    criteria.staffId === 'all'
                      ? 'All Staff'
                      : staffList?.find((s: any) => s.id === criteria.staffId)
                          ?.staff_name || 'Selected Staff',
                  Scope: criteria.actionableOnly
                    ? 'Pending Tasks Only'
                    : 'All Records',
                  Grouping:
                    criteria.groupBy === 'staff'
                      ? 'By Staff Member'
                      : 'By Onboarding Task',
                }}
              >
                <div className="font-sans text-gray-900 mt-6">
                  {/* Summary KPIs */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    <div className="p-4 rounded-lg bg-gray-50 border border-gray-100 flex flex-col items-center">
                      <span className="text-2xl font-black text-gray-900">
                        {kpis.total}
                      </span>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                        Total Items Listed
                      </span>
                    </div>
                    <div className="p-4 rounded-lg bg-amber-50 border border-amber-100 flex flex-col items-center">
                      <span className="text-2xl font-black text-amber-600">
                        {kpis.pending}
                      </span>
                      <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-1">
                        Pending Tasks
                      </span>
                    </div>
                    {!criteria.actionableOnly && (
                      <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100 flex flex-col items-center">
                        <span className="text-2xl font-black text-emerald-600">
                          {kpis.complete}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">
                          Complete
                        </span>
                      </div>
                    )}
                  </div>

                  {filteredItems.length === 0 ? (
                    <div className="border border-gray-100 p-12 rounded-xl bg-gray-50/50 text-center flex flex-col items-center">
                      <ClipboardCheck className="size-12 text-emerald-400 mb-4" />
                      <h3 className="text-lg font-bold text-gray-800">
                        All Clear
                      </h3>
                      <p className="text-sm text-gray-500 mt-1 max-w-sm">
                        No onboarding records match the current criteria.
                        {criteria.actionableOnly &&
                          ' All onboarding tasks are currently complete.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {Object.entries(groupedData).map(
                        ([groupName, records]) => (
                          <div
                            key={groupName}
                            className="print:break-inside-avoid"
                          >
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.1em] border-b-2 border-gray-900 pb-2 mb-4 bg-gray-50 p-2 pl-3 rounded-t-lg">
                              {groupName}{' '}
                              <span className="text-gray-400 text-xs font-normal ml-2 tracking-normal">
                                ({records.length} items)
                              </span>
                            </h3>

                            <Table className="text-xs mb-8">
                              <TableHeader>
                                <TableRow className="bg-white border-b border-gray-200">
                                  {criteria.groupBy !== 'staff' && (
                                    <TableHead className="font-bold text-gray-600 uppercase tracking-wider py-2">
                                      Staff Member
                                    </TableHead>
                                  )}
                                  {criteria.groupBy !== 'task' && (
                                    <TableHead className="font-bold text-gray-600 uppercase tracking-wider py-2">
                                      Onboarding Task
                                    </TableHead>
                                  )}
                                  <TableHead className="font-bold text-gray-600 uppercase tracking-wider py-2 w-32 text-center">
                                    Status
                                  </TableHead>
                                  <TableHead className="font-bold text-gray-600 uppercase tracking-wider py-2">
                                    Comments
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {records.map((item, idx) => (
                                  <TableRow
                                    key={`${item.staff_id}-${item.onboarding_item_id}-${idx}`}
                                    className="border-b border-gray-100 bg-white"
                                  >
                                    {criteria.groupBy !== 'staff' && (
                                      <TableCell className="py-2.5 font-semibold text-gray-900">
                                        <Link
                                          to={`${ROUTES.STAFF_DETAIL}/${item.staff_id}#staff_onboarding`}
                                          className="text-blue-700 hover:underline"
                                        >
                                          {item.staff_name}
                                        </Link>
                                      </TableCell>
                                    )}
                                    {criteria.groupBy !== 'task' && (
                                      <TableCell className="py-2.5 text-gray-800 font-medium">
                                        {item.item_name}
                                      </TableCell>
                                    )}
                                    <TableCell className="py-2.5 text-center">
                                      <span
                                        className={cn(
                                          'px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider inline-block',
                                          item.is_complete
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-amber-100 text-amber-700',
                                        )}
                                      >
                                        {item.is_complete
                                          ? 'Complete'
                                          : 'Pending'}
                                      </span>
                                    </TableCell>
                                    <TableCell className="py-2.5 text-gray-500 italic">
                                      {item.comments || '-'}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </div>
              </PrintableReport>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
