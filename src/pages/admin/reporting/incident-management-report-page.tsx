import { useState } from 'react';
import { Container } from '@/components/common/container';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Filter, 
  ArrowLeft,
  Calendar as CalendarIcon,
  X,
  Printer,
  Loader2
} from 'lucide-react';
import { useNavigate, Link } from 'react-router';
import { ROUTES } from '@/config/routes.config';
import { useIncidentReports } from '@/hooks/use-incident-reports';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  subMonths, 
  startOfQuarter, 
  endOfQuarter, 
  subQuarters,
  setMonth,
  setYear,
  getYear,
  getMonth
} from 'date-fns';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { PrintableReport } from '@/components/common/printable-report';

export function IncidentManagementReportPage() {
  const navigate = useNavigate();
  
  // State for date range
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const [preset, setPreset] = useState<string>('this-month');

  // Fetch data - get all for the report preview (no pagination for the print version)
  const { data, isLoading } = useIncidentReports({
    startDate: dateRange?.from?.toISOString(),
    endDate: dateRange?.to?.toISOString(),
    pageSize: 1000, // Fetch everything for the report
  });

  const handlePrint = () => {
    window.print();
  };

  const applyPreset = (value: string) => {
    setPreset(value);
    const now = new Date();
    let from: Date | undefined;
    let to: Date | undefined;

    switch (value) {
      case 'last-month':
        from = startOfMonth(subMonths(now, 1));
        to = endOfMonth(subMonths(now, 1));
        break;
      case 'last-quarter':
        from = startOfQuarter(subQuarters(now, 1));
        to = endOfQuarter(subQuarters(now, 1));
        break;
      case 'last-fy': {
        const currentYear = getYear(now);
        const currentMonth = getMonth(now);
        if (currentMonth >= 6) {
          from = setMonth(setYear(new Date(), currentYear - 1), 6);
          from = startOfMonth(from);
          to = setMonth(setYear(new Date(), currentYear), 5);
          to = endOfMonth(to);
        } else {
          from = setMonth(setYear(new Date(), currentYear - 2), 6);
          from = startOfMonth(from);
          to = setMonth(setYear(new Date(), currentYear - 1), 5);
          to = endOfMonth(to);
        }
        break;
      }
      case 'this-month':
        from = startOfMonth(now);
        to = endOfMonth(now);
        break;
    }

    if (from && to) {
      setDateRange({ from, to });
    }
  };

  const dateRangeString = dateRange?.from && dateRange?.to 
    ? `${format(dateRange.from, 'dd MMM yyyy')} - ${format(dateRange.to, 'dd MMM yyyy')}`
    : 'All Time';

  return (
    <Container className="pt-2 pb-6 max-w-full lg:px-10 text-gray-900">
      <div className="flex flex-col gap-6">
        {/* The entire top header has been removed as it is redundant to the report content */}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Criteria - Hidden on print */}
          <div className="lg:col-span-3 space-y-4 no-print">
            <div className="sticky top-6 space-y-4">
              <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.REPORTING)} className="w-fit">
                <ArrowLeft className="size-4 me-1.5" />
                Back to Reports
              </Button>

              <Card>
                <CardHeader className="border-b border-gray-100 pb-4">
                  <CardTitle className="text-base flex items-center gap-2 font-sans">
                    <Filter className="size-4 text-primary" /> Report Criteria
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest font-sans">Time Period</label>
                  <Select value={preset} onValueChange={applyPreset}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Custom Range</SelectItem>
                      <SelectItem value="this-month">This Month</SelectItem>
                      <SelectItem value="last-month">Last Month</SelectItem>
                      <SelectItem value="last-quarter">Last Quarter</SelectItem>
                      <SelectItem value="last-fy">Last Financial Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest font-sans">Custom Date Range</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-10 font-sans",
                          !dateRange && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <span className="text-xs">
                              {format(dateRange.from, "dd MMM")} - {format(dateRange.to, "dd MMM, yyyy")}
                            </span>
                          ) : (
                            <span className="text-xs">{format(dateRange.from, "dd MMM, yyyy")}</span>
                          )
                        ) : (
                          <span className="text-xs">Pick dates...</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={(range) => {
                          setDateRange(range);
                          setPreset('custom');
                        }}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="pt-4 border-t border-gray-50 flex flex-col gap-3">
                  <Button variant="primary" onClick={handlePrint} disabled={isLoading} className="w-full font-bold">
                    <Printer className="size-4 me-2" />
                    Print Preview
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full text-xs text-gray-500 hover:text-primary font-sans" 
                    onClick={() => {
                      setPreset('this-month');
                      applyPreset('this-month');
                    }}
                  >
                    <X className="size-3 me-2" />
                    Reset to Defaults
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100/50">
               <h4 className="text-blue-900 font-bold text-sm mb-2 font-sans">InsideCare Report</h4>
               <p className="text-blue-700/70 text-xs leading-relaxed font-sans">
                 Adjust the time period on the left to see your report update instantly on the right.
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
                  <span className="text-sm font-bold text-gray-500 uppercase tracking-widest font-sans">Generating Preview...</span>
                </div>
              </div>
            )}

            <div className="w-full max-w-[210mm] print:m-0 print:p-0">
              <PrintableReport 
                title="Incident Management Report" 
                subtitle="InsideCare Clinical Oversight & Safety Review"
                parameters={{
                  'Date Range': dateRangeString,
                }}
              >
                <div className="space-y-10 pt-4 font-sans">
                  {/* Executive Summary stats have been removed as per requested simplified layout, 
                      but kept within the report itself for professionalism if desired. 
                      Actually, let's keep the document looking rich but remove the HTML 'strange totals' outside it. */}
                  
                  {/* Detailed Log */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em] border-b-2 border-gray-900 pb-2 inline-block">
                      Incident Chronology
                    </h3>
                    
                    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200 font-bold text-gray-600 uppercase tracking-wider font-sans">
                            <th className="px-5 py-4 w-32">Date</th>
                            <th className="px-5 py-4 w-40">Classification</th>
                            <th className="px-5 py-4">Description & Context</th>
                            <th className="px-5 py-4 w-28 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {(data?.data || []).map((report, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/50 transition-colors align-top font-sans">
                              <td className="px-5 py-5 font-bold text-gray-900 tabular-nums">
                                {format(new Date(report.incident_date), 'dd MMM yyyy')}<br/>
                                <span className="text-[10px] font-medium text-gray-400">{format(new Date(report.incident_date), 'HH:mm')}</span>
                              </td>
                              <td className="px-5 py-5">
                                <div className="flex flex-col gap-1.5">
                                  <span className="text-[10px] font-black uppercase text-gray-900 leading-none">
                                    {report.incident_type}
                                  </span>
                                  <span className={cn(
                                    "text-[9px] font-bold uppercase tracking-tighter self-start px-1.5 py-0.5 rounded",
                                    report.priority === 'Critical' ? "bg-red-100 text-red-700" :
                                    report.priority === 'High' ? "bg-orange-100 text-orange-700" :
                                    "bg-gray-100 text-gray-600"
                                  )}>
                                    {report.priority}
                                  </span>
                                </div>
                              </td>
                              <td className="px-5 py-5">
                                <div className="font-bold text-gray-900 mb-1">
                                  {report.participant ? (
                                    <Link 
                                      to={`${ROUTES.PARTICIPANT_DETAIL}/${report.participant.id}`}
                                      className="text-blue-700 dark:text-blue-400 hover:underline transition-colors"
                                    >
                                      {report.participant.participant_name}
                                    </Link>
                                  ) : report.staff ? (
                                    <Link 
                                      to={`${ROUTES.STAFF_DETAIL}/${report.staff.id}`}
                                      className="text-blue-700 dark:text-blue-400 hover:underline transition-colors"
                                    >
                                      {report.staff.staff_name}
                                    </Link>
                                  ) : (
                                    'General Context'
                                  )}
                                </div>
                                <p className="text-gray-600 leading-relaxed italic">
                                  "{report.description}"
                                </p>
                                <div className="mt-2 flex items-center gap-2 text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                                  <span>
                                    House: {' '}
                                    {report.house ? (
                                      <Link 
                                        to={`${ROUTES.HOUSE_DETAIL}/${report.house.id}`}
                                        className="text-blue-700 dark:text-blue-400 hover:underline transition-colors font-bold"
                                      >
                                        {report.house.house_name}
                                      </Link>
                                    ) : 'N/A'}
                                  </span>
                                  <span className="text-gray-200">|</span>
                                  <span>
                                    Reporter: {' '}
                                    {report.reporter ? (
                                      <Link 
                                        to={`${ROUTES.STAFF_DETAIL}/${report.reporter.id}`}
                                        className="text-blue-700 dark:text-blue-400 hover:underline transition-colors font-bold"
                                      >
                                        {report.reporter.staff_name}
                                      </Link>
                                    ) : 'System'}
                                  </span>
                                </div>
                              </td>
                              <td className="px-5 py-5 text-center">
                                <span className="text-[10px] font-black uppercase text-gray-500 whitespace-nowrap">
                                  {report.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {(data?.data || []).length === 0 && (
                            <tr>
                              <td colSpan={4} className="px-5 py-24 text-center">
                                <div className="flex flex-col items-center gap-2 opacity-30">
                                  <X className="size-10 text-gray-400" />
                                  <span className="text-sm font-bold uppercase tracking-widest italic font-sans">No Records Found</span>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Certification Section (Always at end of printable report) */}
                  <div className="mt-12 grid grid-cols-2 gap-10 pt-12 border-t border-gray-100">
                    <div className="space-y-4">
                      <div className="h-px bg-gray-900 w-full mb-8"></div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Clinical Manager Signature</div>
                    </div>
                    <div className="space-y-4 text-right">
                      <div className="h-px bg-gray-900 w-full mb-8"></div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 text-right font-sans">Date of Review</div>
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
