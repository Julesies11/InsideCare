import { useEffect, useMemo, useState } from 'react';
import {
  differenceInDays,
  endOfQuarter,
  format,
  startOfQuarter,
  subDays,
  subQuarters,
} from 'date-fns';
import {
  AlertTriangle,
  ArrowLeft,
  Filter,
  Loader2,
  Printer,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';
import { ROUTES } from '@/config/routes.config';
import { cn } from '@/lib/utils';
import { useIncidentReports } from '@/hooks/use-incident-reports';
import { useIncidentTypesMaster } from '@/hooks/use-incident-types-master';
import { detectIncidentPatterns } from '@/lib/incident-pattern-detection';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Container } from '@/components/common/container';
import { PrintableReport } from '@/components/common/printable-report';
import { Textarea } from '@/components/ui/textarea';

const YEARS = Array.from({ length: 6 }, (_, i) => (new Date().getFullYear() - 3 + i).toString()).reverse();

const QUARTERS = [
  { value: '1', label: 'Q1 (Jul - Sep)' },
  { value: '2', label: 'Q2 (Oct - Dec)' },
  { value: '3', label: 'Q3 (Jan - Mar)' },
  { value: '4', label: 'Q4 (Apr - Jun)' },
];

const getCurrentQuarter = () => {
  const month = new Date().getMonth();
  if (month >= 6 && month <= 8) return '1';
  if (month >= 9 && month <= 11) return '2';
  if (month >= 0 && month <= 2) return '3';
  return '4';
};

export function IncidentQuarterlyAuditReportPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL State
  const [selectedQuarter, setSelectedQuarter] = useState<string>(
    searchParams.get('quarter') || getCurrentQuarter(),
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    searchParams.get('year') || new Date().getFullYear().toString(),
  );

  // Manual Commentary State (In browser memory)
  const [executiveSummary, setExecutiveSummary] = useState('');
  const [mitigationComments, setMitigationComments] = useState('');

  // Date Range Calculation
  const dateRange = useMemo(() => {
    const yearNum = parseInt(selectedYear);
    const qNum = parseInt(selectedQuarter);
    let startMonth = 6; // default to Q1 (Jul)
    if (qNum === 2) startMonth = 9; // Q2 (Oct)
    else if (qNum === 3) startMonth = 0; // Q3 (Jan)
    else if (qNum === 4) startMonth = 3; // Q4 (Apr)

    const baseDate = new Date(yearNum, startMonth, 1);
    return {
      from: startOfQuarter(baseDate),
      to: endOfQuarter(baseDate),
    };
  }, [selectedQuarter, selectedYear]);

  const prevPeriod = useMemo(() => {
    return {
      from: subQuarters(dateRange.from, 1),
      to: subQuarters(dateRange.to, 1),
    };
  }, [dateRange]);

  // Sync to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set('quarter', selectedQuarter);
    params.set('year', selectedYear);
    if (params.toString() !== searchParams.toString()) {
      setSearchParams(params, { replace: true });
    }
  }, [selectedQuarter, selectedYear, searchParams, setSearchParams]);

  // Data Fetching
  const { data: incidentTypes = [], isLoading: isLoadingTypes } = useIncidentTypesMaster(true);
  const { data: currentData, isLoading: isLoadingCurrent } = useIncidentReports({
    startDate: dateRange.from.toISOString(),
    endDate: dateRange.to.toISOString(),
    pageSize: 1000,
  });
  const { data: prevData, isLoading: isLoadingPrev } = useIncidentReports({
    startDate: prevPeriod.from.toISOString(),
    endDate: prevPeriod.to.toISOString(),
    pageSize: 1000,
  });

  const isLoading = isLoadingCurrent || isLoadingPrev || isLoadingTypes;

  // Analysis Logic (reused/simplified from Summary Report)
  const stats = useMemo(() => {
    if (isLoading) return { total: 0, prevTotal: 0, alerts: [], breakdown: [] };
    
    const currentList = currentData?.data || [];
    const prevList = prevData?.data || [];
    const alerts = detectIncidentPatterns(currentList);

    const breakdownMap = new Map();
    incidentTypes.forEach(t => breakdownMap.set(t.id, { name: t.name, count: 0 }));

    currentList.forEach(inc => {
      if (inc.incident_type_id && breakdownMap.has(inc.incident_type_id)) {
        breakdownMap.get(inc.incident_type_id).count++;
      }
    });

    const breakdown = Array.from(breakdownMap.values())
      .filter(b => b.count > 0)
      .sort((a, b) => b.count - a.count);

    return {
      total: currentList.length,
      prevTotal: prevList.length,
      alerts,
      breakdown
    };
  }, [currentData, prevData, incidentTypes, isLoading]);

  const handlePrint = () => window.print();

  return (
    <Container className="pt-2 pb-6 max-w-full lg:px-10 text-gray-900">
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls - Hidden on print */}
          <div className="lg:col-span-3 space-y-4 no-print">
            <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.REPORTING)} className="w-fit">
              <ArrowLeft className="size-4 me-1.5" /> Back to Reports
            </Button>

            <Card>
              <CardHeader className="border-b border-gray-100 pb-4">
                <CardTitle className="text-base flex items-center gap-2 font-sans">
                  <Filter className="size-4 text-primary" /> Audit Parameters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest font-sans">Quarter</label>
                  <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {QUARTERS.map(q => <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest font-sans">Year</label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="pt-4 border-t border-gray-50">
                  <Button variant="primary" onClick={handlePrint} disabled={isLoading} className="w-full font-bold">
                    <Printer className="size-4 me-2" /> Print Audit PDF
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="bg-orange-50/50 rounded-xl p-6 border border-orange-100/50">
              <h4 className="text-orange-900 font-bold text-sm mb-2 font-sans">Quarterly Internal Audit</h4>
              <p className="text-orange-700/70 text-xs leading-relaxed font-sans">
                This report consolidates incident volume, trend analysis, and pattern detection. Use the commentary fields to provide professional oversight and mitigation strategies.
              </p>
            </div>
          </div>

          {/* Audit Report Preview */}
          <div className="lg:col-span-9 bg-gray-100/50 rounded-2xl border border-gray-200 min-h-[1000px] flex flex-col items-center py-4 px-4 relative shadow-inner print:bg-transparent print:border-none print:shadow-none print:p-0">
            {isLoading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-center">
                  <Loader2 className="size-8 animate-spin text-primary" />
                  <span className="text-sm font-bold text-gray-500 uppercase tracking-widest font-sans">Aggregating Quarterly Audit Data...</span>
                </div>
              </div>
            )}

            <div className="w-full max-w-[210mm] print:m-0 print:p-0">
              <PrintableReport
                title="Incident & Risk Internal Audit"
                subtitle="Quarterly Governance & Pattern Compliance Review"
                parameters={{
                  'Audit Period': `Q${selectedQuarter} ${selectedYear}`,
                  'Current Range': `${format(dateRange.from, 'dd MMM yyyy')} - ${format(dateRange.to, 'dd MMM yyyy')}`,
                  'Status': 'Draft Review'
                }}
              >
                <div className="space-y-8 pt-4 font-sans">
                  {/* 1. EXECUTIVE SUMMARY SECTION */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest border-b border-gray-200 pb-1.5">
                      1. Executive Summary (Admin Oversight)
                    </h3>
                    <div className="no-print">
                      <Textarea 
                        placeholder="Write professional executive summary here..." 
                        className="min-h-[150px] text-xs leading-relaxed font-medium"
                        value={executiveSummary}
                        onChange={(e) => setExecutiveSummary(e.target.value)}
                      />
                    </div>
                    <div className="print-only hidden text-xs leading-relaxed font-medium text-gray-800 italic whitespace-pre-wrap min-h-[50px] py-2">
                      {executiveSummary || "No executive summary provided for this audit period."}
                    </div>
                  </div>

                  {/* 2. INCIDENT VOLUME & TRENDS */}
                  <div className="space-y-4">
                     <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest border-b border-gray-200 pb-1.5">
                        2. Volume & Statistical Analysis
                     </h3>
                     <div className="grid grid-cols-3 gap-4">
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center text-center">
                           <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider mb-1">Total Incidents</span>
                           <span className="text-3xl font-black text-gray-900 leading-none">{stats.total}</span>
                           <div className="mt-2">
                              {(() => {
                                const diff = stats.total - stats.prevTotal;
                                if (diff === 0) return <Badge variant="outline" className="text-[9px]">Stable</Badge>;
                                return (
                                  <Badge variant={diff > 0 ? "destructive" : "success"} className="text-[9px] font-black">
                                    {diff > 0 ? <TrendingUp className="size-2.5 me-1" /> : <TrendingDown className="size-2.5 me-1" />}
                                    {Math.abs(diff)} vs Prev Qtr
                                  </Badge>
                                );
                              })()}
                           </div>
                        </div>

                        <div className="col-span-2 border border-gray-200 rounded-lg overflow-hidden">
                           <table className="w-full text-[10px] text-left">
                              <thead className="bg-gray-50 border-b border-gray-200 font-bold uppercase tracking-wider text-gray-500">
                                 <tr>
                                    <th className="px-4 py-2">Classification Type</th>
                                    <th className="px-4 py-2 text-right">Count</th>
                                    <th className="px-4 py-2 text-right">% Share</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                 {stats.breakdown.slice(0, 5).map((b, i) => (
                                   <tr key={i}>
                                      <td className="px-4 py-2 font-bold text-gray-900">{b.name}</td>
                                      <td className="px-4 py-2 text-right font-black">{b.count}</td>
                                      <td className="px-4 py-2 text-right font-medium text-gray-500">{Math.round((b.count / (stats.total || 1)) * 100)}%</td>
                                   </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     </div>
                  </div>

                  {/* 3. PATTERN DETECTION SECTION */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest border-b border-gray-200 pb-1.5">
                      3. Pattern Detection & Threshold Monitoring
                    </h3>
                    <div className="bg-gray-900 rounded-xl p-4 text-white">
                       <div className="flex items-center gap-2 mb-4">
                          <AlertTriangle className="size-4 text-orange-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Active Pattern Alerts (High Risk Focus)</span>
                       </div>
                       
                       {stats.alerts.length > 0 ? (
                         <div className="space-y-3">
                            {stats.alerts.map((alert, i) => (
                              <div key={i} className="border-l-2 border-orange-400 pl-4 py-1">
                                 <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-orange-400">{alert.ruleName}</span>
                                    <span className={cn(
                                      "text-[8px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-tighter",
                                      alert.severity === 'Critical' ? "bg-red-600" : "bg-orange-500"
                                    )}>{alert.severity}</span>
                                 </div>
                                 <p className="text-[11px] font-bold leading-relaxed">
                                    {alert.involvedEntities[0]}: {alert.triggerDescription}
                                 </p>
                                 <p className="text-[9px] text-gray-400 mt-1 italic font-medium">
                                    Action Required: {alert.suggestedAction}
                                 </p>
                              </div>
                            ))}
                         </div>
                       ) : (
                         <div className="py-4 text-center border border-dashed border-gray-700 rounded-lg">
                            <p className="text-[10px] font-bold text-gray-500 italic uppercase">No statistical pattern thresholds exceeded in this quarter.</p>
                         </div>
                       )}
                    </div>
                  </div>

                  {/* 4. CONTROLS & MITIGATIONS (MANUAL SECTION) */}
                  <div className="space-y-4 pt-4">
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest border-b border-gray-200 pb-1.5">
                      4. Control Measures & Internal Mitigations
                    </h3>
                    <div className="no-print">
                      <p className="text-[10px] text-gray-500 font-bold mb-2 uppercase tracking-tight">Provide manual commentary on existing controls and new mitigations in place:</p>
                      <Textarea 
                        placeholder="Detail the controls and mitigations currently in place for the identified patterns..." 
                        className="min-h-[150px] text-xs leading-relaxed font-medium"
                        value={mitigationComments}
                        onChange={(e) => setMitigationComments(e.target.value)}
                      />
                    </div>
                    <div className="print-only hidden text-xs leading-relaxed font-medium text-gray-800 whitespace-pre-wrap py-2 border border-gray-200 rounded-lg p-4 bg-gray-50/30">
                      {mitigationComments || "No specific control measures or mitigations were detailed for this audit period."}
                    </div>
                  </div>

                  {/* 5. AUDIT CERTIFICATION */}
                  <div className="mt-12 pt-12 border-t border-gray-200 grid grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <div className="h-px bg-gray-900 w-full mb-2"></div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Governance Manager / Auditor</div>
                    </div>
                    <div className="space-y-6 text-right">
                      <div className="h-px bg-gray-900 w-full mb-2"></div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Date of Internal Audit</div>
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
