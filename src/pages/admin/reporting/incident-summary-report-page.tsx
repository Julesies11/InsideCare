import { useEffect, useMemo, useState } from 'react';
import {
  differenceInDays,
  endOfMonth,
  endOfQuarter,
  format,
  startOfMonth,
  startOfQuarter,
  subDays,
  subMonths,
  subQuarters,
  subYears,
} from 'date-fns';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar as CalendarIcon,
  Eye,
  EyeOff,
  Filter,
  Loader2,
  Minus,
  Printer,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { Link, useNavigate, useSearchParams } from 'react-router';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ROUTES } from '@/config/routes.config';
import { cn } from '@/lib/utils';
import { useIncidentReports } from '@/hooks/use-incident-reports';
import { useIncidentTypesMaster } from '@/hooks/use-incident-types-master';
import { detectIncidentPatterns, generateIncidentInsights } from '@/lib/incident-pattern-detection';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Container } from '@/components/common/container';
import { PrintableReport } from '@/components/common/printable-report';

// Year ranges for selections
const YEARS = Array.from({ length: 11 }, (_, i) => (2020 + i).toString());

const MONTHS = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const QUARTERS = [
  { value: '1', label: 'Q1 (Jan - Mar)' },
  { value: '2', label: 'Q2 (Apr - Jun)' },
  { value: '3', label: 'Q3 (Jul - Sep)' },
  { value: '4', label: 'Q4 (Oct - Dec)' },
];

const FINANCIAL_YEARS = Array.from({ length: 11 }, (_, i) => {
  const start = 2020 + i;
  return {
    value: start.toString(),
    label: `FY ${start} - ${start + 1}`,
  };
}).reverse();

/**
 * Calculates the previous period based on the current period and period type.
 */
export function getPreviousPeriod(
  from: Date,
  to: Date,
  periodType: string,
): { from: Date; to: Date } {
  switch (periodType) {
    case 'monthly':
      return {
        from: subMonths(from, 1),
        to: subMonths(to, 1),
      };
    case 'quarterly':
      return {
        from: subQuarters(from, 1),
        to: subQuarters(to, 1),
      };
    case 'financial-year':
    case 'calendar-year':
      return {
        from: subYears(from, 1),
        to: subYears(to, 1),
      };
    case 'custom':
    default: {
      const daysDiff = differenceInDays(to, from) + 1;
      return {
        from: subDays(from, daysDiff),
        to: subDays(to, daysDiff),
      };
    }
  }
}

export function IncidentSummaryReportPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showChronology, setShowChronology] = useState(false);

  // Resolve URL state or default values
  const [periodType, setPeriodType] = useState<string>(
    searchParams.get('periodType') || 'monthly',
  );
  const [selectedMonth, setSelectedMonth] = useState<string>(
    searchParams.get('month') || (new Date().getMonth() + 1).toString(),
  );
  const [selectedQuarter, setSelectedQuarter] = useState<string>(
    searchParams.get('quarter') ||
      Math.ceil((new Date().getMonth() + 1) / 3).toString(),
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    searchParams.get('year') || new Date().getFullYear().toString(),
  );

  const currentFYStartYear =
    new Date().getMonth() >= 6
      ? new Date().getFullYear()
      : new Date().getFullYear() - 1;
  const [selectedFY, setSelectedFY] = useState<string>(
    searchParams.get('fy') || currentFYStartYear.toString(),
  );

  const [customRange, setCustomRange] = useState<DateRange | undefined>(() => {
    const fromStr = searchParams.get('from');
    const toStr = searchParams.get('to');
    if (fromStr && toStr) {
      return { from: new Date(fromStr), to: new Date(toStr) };
    }
    return { from: startOfMonth(new Date()), to: endOfMonth(new Date()) };
  });

  // Calculate current date range dynamically
  const dateRange = useMemo(() => {
    const yearNum = parseInt(selectedYear);

    switch (periodType) {
      case 'monthly': {
        const monthNum = parseInt(selectedMonth) - 1;
        const baseDate = new Date(yearNum, monthNum, 1);
        return {
          from: startOfMonth(baseDate),
          to: endOfMonth(baseDate),
        };
      }
      case 'quarterly': {
        const qNum = parseInt(selectedQuarter);
        const startMonth = (qNum - 1) * 3;
        const baseDate = new Date(yearNum, startMonth, 1);
        return {
          from: startOfQuarter(baseDate),
          to: endOfQuarter(baseDate),
        };
      }
      case 'financial-year': {
        const fyStart = parseInt(selectedFY);
        return {
          from: new Date(fyStart, 6, 1),
          to: new Date(fyStart + 1, 5, 30, 23, 59, 59, 999),
        };
      }
      case 'calendar-year': {
        return {
          from: new Date(yearNum, 0, 1),
          to: new Date(yearNum, 11, 31, 23, 59, 59, 999),
        };
      }
      case 'custom':
      default:
        return customRange;
    }
  }, [
    periodType,
    selectedMonth,
    selectedQuarter,
    selectedYear,
    selectedFY,
    customRange,
  ]);

  // Calculate previous period date range
  const prevPeriod = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return null;
    return getPreviousPeriod(dateRange.from, dateRange.to, periodType);
  }, [dateRange, periodType]);

  // Sync state changes to URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(searchParams);

    params.set('periodType', periodType);

    if (periodType === 'monthly') {
      params.set('month', selectedMonth);
      params.set('year', selectedYear);
      params.delete('quarter');
      params.delete('fy');
      params.delete('from');
      params.delete('to');
    } else if (periodType === 'quarterly') {
      params.set('quarter', selectedQuarter);
      params.set('year', selectedYear);
      params.delete('month');
      params.delete('fy');
      params.delete('from');
      params.delete('to');
    } else if (periodType === 'financial-year') {
      params.set('fy', selectedFY);
      params.delete('month');
      params.delete('quarter');
      params.delete('year');
      params.delete('from');
      params.delete('to');
    } else if (periodType === 'calendar-year') {
      params.set('year', selectedYear);
      params.delete('month');
      params.delete('quarter');
      params.delete('fy');
      params.delete('from');
      params.delete('to');
    } else if (
      periodType === 'custom' &&
      customRange?.from &&
      customRange?.to
    ) {
      params.set('from', customRange.from.toISOString());
      params.set('to', customRange.to.toISOString());
      params.delete('month');
      params.delete('quarter');
      params.delete('year');
      params.delete('fy');
    }

    if (params.toString() !== searchParams.toString()) {
      setSearchParams(params, { replace: true });
    }
  }, [
    periodType,
    selectedMonth,
    selectedQuarter,
    selectedYear,
    selectedFY,
    customRange,
    searchParams,
    setSearchParams,
  ]);

  // Fetch classifications
  const { data: incidentTypes = [], isLoading: isLoadingTypes } =
    useIncidentTypesMaster(true);

  // Fetch current period data
  const { data: currentData, isLoading: isLoadingCurrent } = useIncidentReports(
    {
      startDate: dateRange?.from?.toISOString(),
      endDate: dateRange?.to?.toISOString(),
      pageSize: 1000,
    },
  );

  // Fetch previous period data
  const { data: prevData, isLoading: isLoadingPrev } = useIncidentReports({
    startDate: prevPeriod?.from?.toISOString(),
    endDate: prevPeriod?.to?.toISOString(),
    pageSize: 1000,
  });

  const isLoading = isLoadingCurrent || isLoadingPrev || isLoadingTypes;

  // Auto-print support
  useEffect(() => {
    if (!isLoading && searchParams.get('print') === 'true') {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, searchParams]);

  const handlePrint = () => {
    window.print();
  };

  // Label for Printable Parameters
  const periodLabel = useMemo(() => {
    switch (periodType) {
      case 'monthly': {
        const monthName =
          MONTHS.find((m) => m.value === selectedMonth)?.label || '';
        return `Monthly: ${monthName} ${selectedYear}`;
      }
      case 'quarterly': {
        const qName =
          QUARTERS.find((q) => q.value === selectedQuarter)?.label || '';
        return `Quarterly: ${qName} ${selectedYear}`;
      }
      case 'financial-year': {
        const fyLabel =
          FINANCIAL_YEARS.find((f) => f.value === selectedFY)?.label || '';
        return `${fyLabel}`;
      }
      case 'calendar-year':
        return `Calendar Year: ${selectedYear}`;
      case 'custom':
      default:
        return 'Custom Date Range';
    }
  }, [periodType, selectedMonth, selectedQuarter, selectedYear, selectedFY]);

  // Aggregate statistics for comparative matching
  const aggregatedStats = useMemo(() => {
    if (isLoading) return [];

    const currentIncidents = currentData?.data || [];
    const prevIncidents = prevData?.data || [];

    const statsMap = new Map<
      string,
      {
        id: string | null;
        name: string;
        currentCount: number;
        prevCount: number;
      }
    >();

    // Seed master types
    incidentTypes.forEach((type) => {
      statsMap.set(type.id, {
        id: type.id,
        name: type.name,
        currentCount: 0,
        prevCount: 0,
      });
    });

    // Count current period
    currentIncidents.forEach((incident) => {
      const typeId = incident.incident_type_id;
      const typeName =
        incident.incident_type_info?.name ||
        incident.incident_type ||
        'Unclassified';

      if (typeId && statsMap.has(typeId)) {
        statsMap.get(typeId)!.currentCount++;
      } else {
        const matched = incidentTypes.find(
          (t) => t.name.toLowerCase() === typeName.toLowerCase(),
        );
        if (matched) {
          statsMap.get(matched.id)!.currentCount++;
        } else {
          const key = `raw-${typeName}`;
          if (!statsMap.has(key)) {
            statsMap.set(key, {
              id: null,
              name: typeName,
              currentCount: 0,
              prevCount: 0,
            });
          }
          statsMap.get(key)!.currentCount++;
        }
      }
    });

    // Count previous period
    prevIncidents.forEach((incident) => {
      const typeId = incident.incident_type_id;
      const typeName =
        incident.incident_type_info?.name ||
        incident.incident_type ||
        'Unclassified';

      if (typeId && statsMap.has(typeId)) {
        statsMap.get(typeId)!.prevCount++;
      } else {
        const matched = incidentTypes.find(
          (t) => t.name.toLowerCase() === typeName.toLowerCase(),
        );
        if (matched) {
          statsMap.get(matched.id)!.prevCount++;
        } else {
          const key = `raw-${typeName}`;
          if (!statsMap.has(key)) {
            statsMap.set(key, {
              id: null,
              name: typeName,
              currentCount: 0,
              prevCount: 0,
            });
          }
          statsMap.get(key)!.prevCount++;
        }
      }
    });

    return Array.from(statsMap.values())
      .filter(
        (stat) =>
          stat.currentCount > 0 ||
          stat.prevCount > 0 ||
          (stat.id && incidentTypes.find((t) => t.id === stat.id)?.is_active),
      )
      .sort(
        (a, b) =>
          b.currentCount - a.currentCount || a.name.localeCompare(b.name),
      );
  }, [currentData, prevData, incidentTypes, isLoading]);

  // Pattern detection and alerts
  const patternData = useMemo(() => {
    if (isLoading || !currentData?.data) return { alerts: [], insights: [] };
    
    // We analyze the full history fetched (up to 1000 records) to find patterns 
    // that might cross the rolling windows defined in rules.
    const alerts = detectIncidentPatterns(currentData.data);
    const insights = generateIncidentInsights(currentData.data);
    
    return { alerts, insights };
  }, [currentData, isLoading]);

  // Aggregated KPI blocks
  const kpis = useMemo(() => {
    if (isLoading)
      return {
        total: { current: 0, prev: 0 },
        severityHigh: { current: 0, prev: 0 },
        restrictive: { current: 0, prev: 0 },
        ndis: { current: 0, prev: 0 },
      };

    const currentList = currentData?.data || [];
    const prevList = prevData?.data || [];

    return {
      total: {
        current: currentList.length,
        prev: prevList.length,
      },
      severityHigh: {
        current: currentList.filter((i) => i.severity === 'High').length,
        prev: prevList.filter((i) => i.severity === 'High').length,
      },
      restrictive: {
        current: currentList.filter((i) => i.is_restrictive_practice).length,
        prev: prevList.filter((i) => i.is_restrictive_practice).length,
      },
      ndis: {
        current: currentList.filter((i) => i.is_ndis_reportable).length,
        prev: prevList.filter((i) => i.is_ndis_reportable).length,
      },
    };
  }, [currentData, prevData, isLoading]);

  const dateRangeString =
    dateRange?.from && dateRange?.to
      ? `${format(dateRange.from, 'dd MMM yyyy')} - ${format(dateRange.to, 'dd MMM yyyy')}`
      : 'All Time';

  const prevRangeString =
    prevPeriod?.from && prevPeriod?.to
      ? `${format(prevPeriod.from, 'dd MMM yyyy')} - ${format(prevPeriod.to, 'dd MMM yyyy')}`
      : 'N/A';

  const renderTrendBadge = (current: number, prev: number) => {
    const diff = current - prev;
    if (diff === 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded-sm">
          <Minus className="size-3" /> No Change
        </span>
      );
    }

    const pct = prev > 0 ? Math.round((diff / prev) * 100) : null;
    const isIncrease = diff > 0;

    return (
      <span
        className={cn(
          'inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-sm border',
          isIncrease
            ? 'text-red-600 bg-red-50 border-red-200'
            : 'text-green-600 bg-green-50 border-green-200',
        )}
      >
        {isIncrease ? (
          <TrendingUp className="size-3" />
        ) : (
          <TrendingDown className="size-3" />
        )}
        {isIncrease ? '+' : ''}
        {diff} {pct !== null ? `(${isIncrease ? '+' : ''}${pct}%)` : ''}
      </span>
    );
  };

  // Dynamic labels for period types
  const periodTerm = useMemo(() => {
    switch (periodType) {
      case 'monthly':
        return 'Month';
      case 'quarterly':
        return 'Quarter';
      case 'financial-year':
        return 'Financial Year';
      case 'calendar-year':
        return 'Year';
      case 'custom':
      default:
        return 'Period';
    }
  }, [periodType]);

  const currentLabel = `Current ${periodTerm}`;
  const prevLabel = `Previous ${periodTerm}`;
  const prevShortLabel = `Prev ${periodTerm}`;

  const chartData = useMemo(() => {
    return aggregatedStats.slice(0, 8).map((stat) => ({
      name:
        stat.name.length > 18 ? `${stat.name.substring(0, 16)}...` : stat.name,
      [currentLabel]: stat.currentCount,
      [prevLabel]: stat.prevCount,
    }));
  }, [aggregatedStats, currentLabel, prevLabel]);

  return (
    <Container className="pt-2 pb-6 max-w-full lg:px-10 text-gray-900">
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Period criteria - Hidden on print */}
          <div className="lg:col-span-3 space-y-4 no-print">
            <div className="sticky top-6 space-y-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(ROUTES.REPORTING)}
                className="w-fit"
              >
                <ArrowLeft className="size-4 me-1.5" />
                Back to Reports
              </Button>

              <Card>
                <CardHeader className="border-b border-gray-100 pb-4">
                  <CardTitle className="text-base flex items-center gap-2 font-sans">
                    <Filter className="size-4 text-primary" /> Report Criteria
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  {/* Period Type Selection */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest font-sans">
                      Report Period Type
                    </label>
                    <Select
                      value={periodType}
                      onValueChange={(val) => setPeriodType(val)}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select period type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="financial-year">
                          Financial Year
                        </SelectItem>
                        <SelectItem value="calendar-year">
                          Calendar Year
                        </SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sub-inputs based on Period Type */}
                  {periodType === 'monthly' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider font-sans">
                          Month
                        </label>
                        <Select
                          value={selectedMonth}
                          onValueChange={setSelectedMonth}
                        >
                          <SelectTrigger className="h-10 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MONTHS.map((m) => (
                              <SelectItem key={m.value} value={m.value}>
                                {m.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider font-sans">
                          Year
                        </label>
                        <Select
                          value={selectedYear}
                          onValueChange={setSelectedYear}
                        >
                          <SelectTrigger className="h-10 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {YEARS.map((y) => (
                              <SelectItem key={y} value={y}>
                                {y}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {periodType === 'quarterly' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider font-sans">
                          Quarter
                        </label>
                        <Select
                          value={selectedQuarter}
                          onValueChange={setSelectedQuarter}
                        >
                          <SelectTrigger className="h-10 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {QUARTERS.map((q) => (
                              <SelectItem key={q.value} value={q.value}>
                                {q.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider font-sans">
                          Year
                        </label>
                        <Select
                          value={selectedYear}
                          onValueChange={setSelectedYear}
                        >
                          <SelectTrigger className="h-10 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {YEARS.map((y) => (
                              <SelectItem key={y} value={y}>
                                {y}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {periodType === 'financial-year' && (
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider font-sans">
                        Financial Year
                      </label>
                      <Select value={selectedFY} onValueChange={setSelectedFY}>
                        <SelectTrigger className="h-10 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FINANCIAL_YEARS.map((f) => (
                            <SelectItem key={f.value} value={f.value}>
                              {f.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {periodType === 'calendar-year' && (
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider font-sans">
                        Calendar Year
                      </label>
                      <Select
                        value={selectedYear}
                        onValueChange={setSelectedYear}
                      >
                        <SelectTrigger className="h-10 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {YEARS.map((y) => (
                            <SelectItem key={y} value={y}>
                              {y}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {periodType === 'custom' && (
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider font-sans">
                        Custom Date Range
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal h-10 font-sans text-xs',
                              !customRange && 'text-muted-foreground',
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                            {customRange?.from ? (
                              customRange.to ? (
                                <span>
                                  {format(customRange.from, 'dd MMM')} -{' '}
                                  {format(customRange.to, 'dd MMM, yyyy')}
                                </span>
                              ) : (
                                <span>
                                  {format(customRange.from, 'dd MMM, yyyy')}
                                </span>
                              )
                            ) : (
                              <span>Pick dates...</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={customRange?.from}
                            selected={customRange}
                            onSelect={setCustomRange}
                            numberOfMonths={2}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-50 flex flex-col gap-3">
                    <Button
                      variant="primary"
                      onClick={handlePrint}
                      disabled={isLoading}
                      className="w-full font-bold"
                    >
                      <Printer className="size-4 me-2" />
                      Print Report
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full text-xs font-bold font-sans"
                      onClick={() => setShowChronology(!showChronology)}
                    >
                      {showChronology ? (
                        <>
                          <EyeOff className="size-3.5 me-2" />
                          Hide Chronology Log
                        </>
                      ) : (
                        <>
                          <Eye className="size-3.5 me-2" />
                          Show Chronology Log
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full text-xs text-gray-500 hover:text-primary font-sans"
                      onClick={() => {
                        setPeriodType('monthly');
                        setSelectedMonth(
                          (new Date().getMonth() + 1).toString(),
                        );
                        setSelectedYear(new Date().getFullYear().toString());
                      }}
                    >
                      <X className="size-3 me-2" />
                      Reset to Defaults
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100/50">
                <h4 className="text-blue-900 font-bold text-sm mb-2 font-sans">
                  Comparative Analysis
                </h4>
                <p className="text-blue-700/70 text-xs leading-relaxed font-sans">
                  Choose a period type (Monthly, Quarterly, Financial Year,
                  Calendar Year) above to compute clinical incident trends
                  against the preceding equivalent calendar period.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Live Report Preview */}
          <div className="lg:col-span-9 bg-gray-100/50 rounded-2xl border border-gray-200 min-h-[1000px] flex flex-col items-center py-4 px-4 overflow-hidden relative shadow-inner print:bg-transparent print:border-none print:shadow-none print:p-0">
            {isLoading && (
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
                title="Incident Summary Report"
                subtitle="InsideCare Clinical Safety & Incident Trend Review"
                parameters={{
                  'Report Period': periodLabel,
                  'Date Range': dateRangeString,
                  'Comparison Period': prevRangeString,
                }}
              >
                <div className="space-y-8 pt-4 font-sans">
                  {/* KPI HIGHLIGHT CARDS */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="shadow-xs border border-gray-200">
                      <CardContent className="p-4 flex flex-col justify-between h-full min-h-[90px]">
                        <span className="text-[9px] uppercase tracking-wider font-black text-gray-400">
                          Total Incidents
                        </span>
                        <div className="flex items-baseline justify-between mt-2">
                          <span className="text-2xl font-black text-gray-900 leading-none">
                            {kpis.total.current}
                          </span>
                          {renderTrendBadge(
                            kpis.total.current,
                            kpis.total.prev,
                          )}
                        </div>
                        <span className="text-[9px] text-gray-400 mt-1 font-medium font-sans">
                          {prevShortLabel}: {kpis.total.prev}
                        </span>
                      </CardContent>
                    </Card>

                    <Card className="shadow-xs border border-gray-200">
                      <CardContent className="p-4 flex flex-col justify-between h-full min-h-[90px]">
                        <span className="text-[9px] uppercase tracking-wider font-black text-gray-400">
                          High Severity
                        </span>
                        <div className="flex items-baseline justify-between mt-2">
                          <span className="text-2xl font-black text-gray-900 leading-none">
                            {kpis.severityHigh.current}
                          </span>
                          {renderTrendBadge(
                            kpis.severityHigh.current,
                            kpis.severityHigh.prev,
                          )}
                        </div>
                        <span className="text-[9px] text-gray-400 mt-1 font-medium font-sans">
                          {prevShortLabel}: {kpis.severityHigh.prev}
                        </span>
                      </CardContent>
                    </Card>

                    <Card className="shadow-xs border border-gray-200">
                      <CardContent className="p-4 flex flex-col justify-between h-full min-h-[90px]">
                        <span className="text-[9px] uppercase tracking-wider font-black text-gray-400">
                          Restrictive Practice
                        </span>
                        <div className="flex items-baseline justify-between mt-2">
                          <span className="text-2xl font-black text-gray-900 leading-none">
                            {kpis.restrictive.current}
                          </span>
                          {renderTrendBadge(
                            kpis.restrictive.current,
                            kpis.restrictive.prev,
                          )}
                        </div>
                        <span className="text-[9px] text-gray-400 mt-1 font-medium font-sans">
                          {prevShortLabel}: {kpis.restrictive.prev}
                        </span>
                      </CardContent>
                    </Card>

                    <Card className="shadow-xs border border-gray-200">
                      <CardContent className="p-4 flex flex-col justify-between h-full min-h-[90px]">
                        <span className="text-[9px] uppercase tracking-wider font-black text-gray-400">
                          NDIS Reportable
                        </span>
                        <div className="flex items-baseline justify-between mt-2">
                          <span className="text-2xl font-black text-gray-900 leading-none">
                            {kpis.ndis.current}
                          </span>
                          {renderTrendBadge(kpis.ndis.current, kpis.ndis.prev)}
                        </div>
                        <span className="text-[9px] text-gray-400 mt-1 font-medium font-sans">
                          {prevShortLabel}: {kpis.ndis.prev}
                        </span>
                      </CardContent>
                    </Card>
                  </div>

                  {/* PATTERN INSIGHTS & ALERTS */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-1.5">
                      <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">
                        Pattern Insights & Alerts
                      </h3>
                      <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-tight">
                        Risk Analysis
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Alert Cards */}
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                          High-Risk Alert Board
                        </h4>
                        {patternData.alerts.length > 0 ? (
                          <div className="space-y-3">
                            {patternData.alerts.map((alert, idx) => (
                              <Card key={idx} className={cn(
                                "border-l-4 shadow-sm",
                                alert.severity === 'Critical' ? "border-l-red-600 bg-red-50/30" : 
                                alert.severity === 'High' ? "border-l-orange-500 bg-orange-50/30" : 
                                "border-l-blue-500 bg-blue-50/30"
                              )}>
                                <CardContent className="p-3">
                                  <div className="flex justify-between items-start mb-1">
                                    <span className="text-[10px] font-black uppercase text-gray-900 leading-tight">
                                      {alert.ruleName}
                                    </span>
                                    <Badge className={cn(
                                      "text-[8px] h-3.5 px-1 font-black uppercase",
                                      alert.severity === 'Critical' ? "bg-red-600" : 
                                      alert.severity === 'High' ? "bg-orange-500" : "bg-blue-500"
                                    )}>
                                      {alert.severity}
                                    </Badge>
                                  </div>
                                  <p className="text-[11px] font-bold text-gray-900 mb-1">
                                    {alert.involvedEntities.join(', ')}: {alert.triggerDescription}
                                  </p>
                                  <div className="bg-white/50 border border-gray-100 rounded p-1.5 mt-2">
                                    <span className="text-[9px] font-black uppercase text-gray-400 block mb-0.5">Recommended Action:</span>
                                    <p className="text-[10px] text-gray-700 leading-tight font-medium">
                                      {alert.suggestedAction}
                                    </p>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="h-24 border border-dashed border-gray-200 rounded-xl flex items-center justify-center bg-gray-50/50">
                             <div className="text-center">
                               <div className="text-[10px] font-black uppercase text-gray-300 tracking-widest">No Patterns Detected</div>
                               <div className="text-[9px] font-medium text-gray-400 mt-0.5 italic">All organizational parameters within normal thresholds.</div>
                             </div>
                          </div>
                        )}
                      </div>

                      {/* Distribution Insights */}
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                          Automated Trend Insights
                        </h4>
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3 h-full max-h-[250px] overflow-y-auto">
                          {patternData.insights.length > 0 ? (
                            <ul className="space-y-3">
                              {patternData.insights.map((insight, idx) => (
                                <li key={idx} className="flex gap-2 items-start">
                                  <div className="size-1.5 rounded-full bg-primary shrink-0 mt-1" />
                                  <p className="text-xs font-bold text-gray-700 leading-normal">
                                    {insight}
                                  </p>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="h-full flex items-center justify-center text-center px-4">
                               <p className="text-[10px] font-bold text-gray-400 italic">
                                 Insufficient data in this period to generate automated distribution insights.
                               </p>
                            </div>
                          )}
                          
                          <div className="pt-4 border-t border-gray-200 mt-2">
                             <p className="text-[9px] leading-relaxed text-gray-500 font-medium italic">
                               Insights are generated automatically by comparing incident volumes across participants and classifications to identify concentration of risk.
                             </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* VISUALIZATION CHART */}
                  {chartData.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest border-b border-gray-200 pb-1.5 inline-block">
                        Comparative Incident Distribution (Top Types)
                      </h3>
                      <div className="h-[280px] w-full pt-4 border border-gray-200/80 rounded-xl bg-gray-50/30 p-2 shadow-xs">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={chartData}
                            margin={{
                              top: 10,
                              right: 10,
                              left: -20,
                              bottom: 5,
                            }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                              stroke="#f3f4f6"
                            />
                            <XAxis
                              dataKey="name"
                              stroke="#6b7280"
                              fontSize={9}
                              fontWeight="bold"
                              tickLine={false}
                            />
                            <YAxis
                              stroke="#6b7280"
                              fontSize={9}
                              fontWeight="bold"
                              tickLine={false}
                              axisLine={false}
                              allowDecimals={false}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 'bold',
                              }}
                            />
                            <Legend
                              verticalAlign="top"
                              height={36}
                              iconSize={10}
                              iconType="circle"
                              wrapperStyle={{
                                fontSize: '10px',
                                fontWeight: 'bold',
                              }}
                            />
                            <Bar
                              dataKey={currentLabel}
                              fill="#3b82f6"
                              radius={[4, 4, 0, 0]}
                              maxBarSize={28}
                            />
                            <Bar
                              dataKey={prevLabel}
                              fill="#9ca3af"
                              radius={[4, 4, 0, 0]}
                              maxBarSize={28}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* COMPARATIVE SUMMARY TABLE */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest border-b border-gray-200 pb-1.5 inline-block">
                      Incident Summary Breakdown
                    </h3>

                    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200 font-bold text-gray-600 uppercase tracking-wider font-sans">
                            <th className="px-5 py-3.5">
                              Incident Classification Type
                            </th>
                            <th className="px-5 py-3.5 w-32 text-center">
                              {currentLabel}
                            </th>
                            <th className="px-5 py-3.5 w-32 text-center">
                              {prevLabel}
                            </th>
                            <th className="px-5 py-3.5 w-44 text-center">
                              Trend / Change
                            </th>
                            <th className="px-5 py-3.5 w-28 text-center">
                              Share of Total
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {aggregatedStats.map((stat, idx) => {
                            const share =
                              kpis.total.current > 0
                                ? Math.round(
                                    (stat.currentCount / kpis.total.current) *
                                      100,
                                  )
                                : 0;

                            return (
                              <tr
                                key={idx}
                                className="hover:bg-gray-50/40 transition-colors align-middle font-sans"
                              >
                                <td className="px-5 py-4 font-bold text-gray-900">
                                  {stat.name}
                                </td>
                                <td className="px-5 py-4 text-center font-bold text-gray-900">
                                  {stat.currentCount}
                                </td>
                                <td className="px-5 py-4 text-center font-medium text-gray-500">
                                  {stat.prevCount}
                                </td>
                                <td className="px-5 py-4 text-center">
                                  {renderTrendBadge(
                                    stat.currentCount,
                                    stat.prevCount,
                                  )}
                                </td>
                                <td className="px-5 py-4 text-center font-bold text-gray-600 tabular-nums">
                                  {stat.currentCount > 0 ? `${share}%` : '—'}
                                </td>
                              </tr>
                            );
                          })}
                          {aggregatedStats.length === 0 && (
                            <tr>
                              <td
                                colSpan={5}
                                className="px-5 py-16 text-center text-gray-400"
                              >
                                <AlertTriangle className="size-8 text-gray-300 mx-auto mb-2" />
                                <span className="font-bold uppercase tracking-wider italic">
                                  No Incident Types Registered
                                </span>
                              </td>
                            </tr>
                          )}
                        </tbody>
                        <tfoot>
                          <tr className="bg-gray-50/80 border-t border-gray-200 font-bold text-gray-900">
                            <td className="px-5 py-4 uppercase tracking-wider">
                              Total Summary
                            </td>
                            <td className="px-5 py-4 text-center text-sm font-black">
                              {kpis.total.current}
                            </td>
                            <td className="px-5 py-4 text-center font-bold text-gray-500">
                              {kpis.total.prev}
                            </td>
                            <td className="px-5 py-4 text-center">
                              {renderTrendBadge(
                                kpis.total.current,
                                kpis.total.prev,
                              )}
                            </td>
                            <td className="px-5 py-4 text-center text-sm font-black">
                              100%
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* CHRONOLOGY LOG (Collapsible on Web, page-broken on Print if open) */}
                  {(showChronology || searchParams.get('print') === 'true') && (
                    <div className="space-y-4 pt-4 page-break">
                      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                        <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">
                          Chronological Log ({currentLabel})
                        </h3>
                        <span className="text-[10px] text-gray-500 font-bold font-sans">
                          Showing {kpis.total.current} record
                          {kpis.total.current !== 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 font-bold text-gray-600 uppercase tracking-wider font-sans">
                              <th className="px-5 py-3 w-32">Date</th>
                              <th className="px-5 py-3 w-40">Classification</th>
                              <th className="px-5 py-3">Summary & Context</th>
                              <th className="px-5 py-3 w-24 text-center">
                                Priority
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 bg-white">
                            {(currentData?.data || []).map((report, idx) => (
                              <tr
                                key={idx}
                                className="hover:bg-gray-50/50 transition-colors align-top font-sans"
                              >
                                <td className="px-5 py-4 font-bold text-gray-900 tabular-nums">
                                  {format(
                                    new Date(report.incident_date),
                                    'dd MMM yyyy',
                                  )}
                                  <br />
                                  <span className="text-[10px] font-medium text-gray-400">
                                    {format(
                                      new Date(report.incident_date),
                                      'HH:mm',
                                    )}
                                  </span>
                                </td>
                                <td className="px-5 py-4">
                                  <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-black uppercase text-gray-900 leading-tight font-sans">
                                      {report.incident_type_info?.name ||
                                        report.incident_type ||
                                        'Unclassified'}
                                    </span>
                                    <div className="flex gap-1 mt-0.5">
                                      {report.is_restrictive_practice && (
                                        <Badge
                                          variant="warning"
                                          className="text-[8px] px-1 h-3.5 font-black uppercase tracking-tighter"
                                        >
                                          RP
                                        </Badge>
                                      )}
                                      {report.is_ndis_reportable && (
                                        <Badge
                                          variant="destructive"
                                          className="text-[8px] px-1 h-3.5 font-black uppercase tracking-tighter"
                                        >
                                          NDIS
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-5 py-4">
                                  <div className="font-bold text-gray-900 mb-1">
                                    {report.participant ? (
                                      <Link
                                        to={`${ROUTES.PARTICIPANT_DETAIL}/${report.participant.id}`}
                                        className="text-blue-700 dark:text-blue-400 hover:underline transition-colors no-print font-sans font-bold"
                                      >
                                        {report.participant.participant_name}
                                      </Link>
                                    ) : (
                                      'General Context'
                                    )}
                                    <span className="print:inline hidden font-bold text-gray-900 font-sans">
                                      {report.participant?.participant_name ||
                                        'General Context'}
                                    </span>
                                  </div>
                                  <p className="text-gray-600 leading-relaxed italic">
                                    "{report.summary}"
                                  </p>
                                  <div className="mt-1 flex items-center gap-2 text-[10px] font-medium text-gray-400 uppercase tracking-wider font-sans">
                                    <span>
                                      House: {report.house?.house_name || 'N/A'}
                                    </span>
                                    <span className="text-gray-200">|</span>
                                    <span>
                                      Reporter:{' '}
                                      {report.reporter?.staff_name || 'System'}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-5 py-4 text-center">
                                  <span
                                    className={cn(
                                      'text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-sm border inline-block',
                                      report.priority === 'Critical'
                                        ? 'border-red-400 text-red-700 bg-red-50'
                                        : report.priority === 'High'
                                          ? 'border-orange-300 text-orange-700 bg-orange-50'
                                          : 'border-gray-200 text-gray-500 bg-gray-50',
                                    )}
                                  >
                                    {report.priority}
                                  </span>
                                </td>
                              </tr>
                            ))}
                            {(currentData?.data || []).length === 0 && (
                              <tr>
                                <td
                                  colSpan={4}
                                  className="px-5 py-12 text-center text-gray-400"
                                >
                                  <span className="text-xs font-bold uppercase tracking-widest italic font-sans">
                                    No Incidents Recorded in {currentLabel}
                                  </span>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Certification Section */}
                  <div className="mt-12 grid grid-cols-2 gap-10 pt-12 border-t border-gray-100">
                    <div className="space-y-4">
                      <div className="h-px bg-gray-900 w-full mb-8"></div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 font-sans">
                        Clinical Manager Signature
                      </div>
                    </div>
                    <div className="space-y-4 text-right">
                      <div className="h-px bg-gray-900 w-full mb-8"></div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 text-right font-sans">
                        Date of Review
                      </div>
                    </div>
                  </div>
                </div>
              </PrintableReport>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
