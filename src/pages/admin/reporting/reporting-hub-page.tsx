import { useState, useMemo } from 'react';
import { Container } from '@/components/common/container';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router';
import { 
  Activity, 
  ShieldCheck, 
  ClipboardList, 
  AlertTriangle,
  ArrowRight,
  Search,
  Star,
  Clock,
  Building,
  Users
} from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';
import { RBAC_MODULES } from '@/config/rbac-modules';
import { ROUTES } from '@/config/routes.config';
import { cn } from '@/lib/utils';

interface ReportCardProps {
  title: string;
  description: string;
  icon: any;
  path: string;
  category: string;
  permission: string;
  implemented?: boolean;
  isFavorite: boolean;
  onToggleFavorite: (path: string) => void;
  onReportClick: (path: string) => void;
}

function ReportCard({ 
  title, 
  description, 
  icon: Icon, 
  path, 
  category, 
  permission, 
  implemented = true,
  isFavorite,
  onToggleFavorite,
  onReportClick
}: ReportCardProps) {
  const navigate = useNavigate();
  const { canView } = usePermissions();

  if (!canView(permission)) return null;

  return (
    <Card 
      className={cn(
        "relative transition-all duration-300 bg-white/60 backdrop-blur-md border border-gray-200/80 shadow-xs select-none",
        implemented 
          ? "hover:shadow-md hover:border-primary/50 cursor-pointer group hover:-translate-y-0.5" 
          : "opacity-60 cursor-not-allowed bg-gray-50/50 border-gray-100/80 shadow-none"
      )} 
      onClick={() => {
        if (implemented) {
          onReportClick(path);
          navigate(path);
        }
      }}
    >
      {/* Star button for favorites */}
      {implemented && (
        <button
          type="button"
          className="absolute top-4 right-4 text-gray-300 hover:text-amber-400 hover:scale-110 active:scale-95 transition-all p-1 z-10"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(path);
          }}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Star className={cn("size-4 transition-colors", isFavorite ? "fill-amber-400 text-amber-400" : "text-gray-300 hover:text-gray-400")} />
        </button>
      )}

      <CardContent className="p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
              implemented 
                ? "bg-gray-100 text-gray-600 group-hover:bg-primary/10 group-hover:text-primary group-hover:scale-105" 
                : "bg-gray-200/50 text-gray-400"
            )}>
              <Icon className="size-6" />
            </div>
            <div className="flex gap-2 items-center mr-6">
              {!implemented && (
                <Badge variant="secondary" className="uppercase text-[9px] font-black tracking-widest text-gray-500 bg-gray-200/80 border-none px-1.5 py-0.5">
                  Coming Soon
                </Badge>
              )}
              <Badge variant="outline" className={cn(
                "uppercase text-[10px] font-bold tracking-wider px-1.5 py-0.5 border-gray-200/80 text-gray-500",
                !implemented && "text-gray-400 border-gray-200/40"
              )}>
                {category}
              </Badge>
            </div>
          </div>
          <div className="space-y-1">
            <h3 className={cn("text-base font-bold transition-colors font-sans", implemented ? "text-gray-900 group-hover:text-primary" : "text-gray-500")}>
              {title}
            </h3>
            <p className={cn("text-xs leading-relaxed min-h-[40px] font-sans", implemented ? "text-gray-500" : "text-gray-400")}>
              {description}
            </p>
          </div>
          {implemented && (
            <div className="flex items-center text-primary font-bold text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity font-sans">
              RUN REPORT <ArrowRight className="size-3.5 ms-1.5 transition-transform group-hover:translate-x-1" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function MiniReportCard({ 
  report, 
  onReportClick 
}: { 
  report: Omit<ReportCardProps, 'isFavorite' | 'onToggleFavorite' | 'onReportClick'>; 
  onReportClick: (path: string) => void;
}) {
  const navigate = useNavigate();
  const Icon = report.icon;
  
  return (
    <div 
      className="flex items-center gap-3 p-3 bg-white/70 border border-gray-200/60 rounded-xl hover:border-primary/50 hover:shadow-xs transition-all cursor-pointer group hover:-translate-y-0.5"
      onClick={() => {
        onReportClick(report.path);
        navigate(report.path);
      }}
    >
      <div className="size-9 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
        <Icon className="size-4.5" />
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="text-xs font-bold text-gray-900 group-hover:text-primary transition-colors truncate font-sans">
          {report.title}
        </h4>
        <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold font-sans">
          {report.category}
        </span>
      </div>
      <ArrowRight className="size-3.5 text-gray-300 group-hover:text-primary transition-colors group-hover:translate-x-0.5" />
    </div>
  );
}

export function ReportingHubPage() {
  const { canView } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('ic_favorite_reports') || '[]');
    } catch {
      return [];
    }
  });

  const [recents, setRecents] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('ic_recent_reports') || '[]');
    } catch {
      return [];
    }
  });

  const reports = useMemo(() => [
    {
      title: 'Incident Management',
      description: 'Summary of accidents, medical incidents, and restrictive practices.',
      icon: AlertTriangle,
      path: ROUTES.REPORTING_CLINICAL_INCIDENTS,
      category: 'Clinical',
      permission: RBAC_MODULES.REPORTING_CLINICAL,
      implemented: true,
    },
    {
      title: 'Participants Report',
      description: 'Summary of participants, houses, NDIS numbers, and clinical support plans.',
      icon: Users,
      path: ROUTES.REPORTING_CLINICAL_PARTICIPANTS,
      category: 'Clinical',
      permission: RBAC_MODULES.REPORTING_CLINICAL,
      implemented: true,
    },
    {
      title: 'Medication Compliance',
      description: 'Review medication administration records and missed doses.',
      icon: ClipboardList,
      path: '/reporting/clinical/medications',
      category: 'Clinical',
      permission: RBAC_MODULES.REPORTING_CLINICAL,
      implemented: false,
    },
    {
      title: 'Restrictive Practice Register',
      description: 'NDIS-compliant register of restraints applied, triggers, and approvals.',
      icon: ShieldCheck,
      path: '/reporting/clinical/restrictive-practices',
      category: 'Clinical',
      permission: RBAC_MODULES.REPORTING_CLINICAL,
      implemented: false,
    },
    {
      title: 'Staff Roster Summary',
      description: 'Overview of rostered hours and coverage across houses.',
      icon: Users,
      path: '/reporting/operational/roster',
      category: 'Operational',
      permission: RBAC_MODULES.REPORTING_OPERATIONAL,
      implemented: false,
    },
    {
      title: 'Timesheet vs Roster Variance',
      description: 'Comparison of rostered hours against actual timesheet hours.',
      icon: ClipboardList,
      path: '/reporting/operational/variance',
      category: 'Operational',
      permission: RBAC_MODULES.REPORTING_OPERATIONAL,
      implemented: false,
    },
    {
      title: 'House Occupancy & Vacancy',
      description: 'Occupancy levels, vacancy rates, and active room roster mapping.',
      icon: Building,
      path: '/reporting/operational/occupancy',
      category: 'Operational',
      permission: RBAC_MODULES.REPORTING_OPERATIONAL,
      implemented: false,
    },
    {
      title: 'Compliance Audit',
      description: 'Tracking of staff certifications, checks, and document expiries.',
      icon: ShieldCheck,
      path: '/reporting/compliance/audit',
      category: 'Compliance',
      permission: RBAC_MODULES.REPORTING_COMPLIANCE,
      implemented: false,
    },
    {
      title: 'Activity Insights',
      description: 'Aggregated audit log data for system-wide transparency.',
      icon: Activity,
      path: '/reporting/compliance/activity',
      category: 'Compliance',
      permission: RBAC_MODULES.REPORTING_COMPLIANCE,
      implemented: false,
    },
    {
      title: 'NDIS Quality Audit Report',
      description: 'High-level checklist preparation document summarizing provider readiness.',
      icon: ShieldCheck,
      path: '/reporting/compliance/ndis-audit',
      category: 'Compliance',
      permission: RBAC_MODULES.REPORTING_COMPLIANCE,
      implemented: false,
    },
  ], []);

  const handleToggleFavorite = (path: string) => {
    setFavorites((prev) => {
      const next = prev.includes(path) 
        ? prev.filter((p) => p !== path) 
        : [...prev, path];
      localStorage.setItem('ic_favorite_reports', JSON.stringify(next));
      return next;
    });
  };

  const handleReportClick = (path: string) => {
    setRecents((prev) => {
      const next = [path, ...prev.filter((p) => p !== path)].slice(0, 4);
      localStorage.setItem('ic_recent_reports', JSON.stringify(next));
      return next;
    });
  };

  const allowedReports = useMemo(() => {
    return reports.filter((r) => canView(r.permission));
  }, [reports, canView]);

  const favoriteReports = useMemo(() => {
    return allowedReports.filter((r) => favorites.includes(r.path) && r.implemented);
  }, [allowedReports, favorites]);

  const recentReports = useMemo(() => {
    return recents
      .map((path) => allowedReports.find((r) => r.path === path))
      .filter((r): r is typeof reports[number] => !!r && r.implemented);
  }, [allowedReports, recents, reports]);

  const filteredReports = useMemo(() => {
    return allowedReports.filter((report) => {
      const matchesSearch = 
        report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = 
        selectedCategory === 'all' || 
        report.category.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [allowedReports, searchTerm, selectedCategory]);

  const hasFavorites = favoriteReports.length > 0;
  const hasRecents = recentReports.length > 0;

  return (
    <Container className="py-6 max-w-7xl">
      <div className="flex flex-col gap-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-gray-900 font-sans tracking-tight">Reporting Hub</h1>
            <p className="text-gray-500 text-sm font-sans max-w-xl">
              Generate and export comprehensive reports for clinical oversight and operational management.
            </p>
          </div>
          
          {/* Sleek Search Input */}
          <div className="relative w-full md:w-80 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search reports..."
              className="pl-9 h-10 bg-white/50 border-gray-200/80 focus-visible:ring-primary/20 text-sm font-sans placeholder:text-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Quick Access Block (Favorites & Recents) */}
        {(hasFavorites || hasRecents) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 bg-gray-50/40 backdrop-blur-xs rounded-2xl border border-gray-200/60 shadow-xs">
            {hasFavorites && (
              <div className="space-y-3">
                <h2 className="text-[10px] font-black uppercase text-gray-400 tracking-wider flex items-center gap-1.5 font-sans">
                  <Star className="size-3.5 text-amber-400 fill-amber-400" /> Favorite Reports
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {favoriteReports.map((report) => (
                    <MiniReportCard 
                      key={report.path} 
                      report={report} 
                      onReportClick={handleReportClick} 
                    />
                  ))}
                </div>
              </div>
            )}
            
            {hasRecents && (
              <div className="space-y-3">
                <h2 className="text-[10px] font-black uppercase text-gray-400 tracking-wider flex items-center gap-1.5 font-sans">
                  <Clock className="size-3.5 text-primary" /> Recently Viewed
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {recentReports.map((report) => (
                    <MiniReportCard 
                      key={report.path} 
                      report={report} 
                      onReportClick={handleReportClick} 
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Categories Tab Control */}
        <Tabs defaultValue="all" value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <div className="border-b border-gray-200/80 mb-6">
            <TabsList variant="line" size="md" className="-mb-px">
              <TabsTrigger value="all">All Reports</TabsTrigger>
              <TabsTrigger value="clinical">Clinical</TabsTrigger>
              <TabsTrigger value="operational">Operational</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
            </TabsList>
          </div>
        </Tabs>

        {/* Reports Grid */}
        {filteredReports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.map((report) => (
              <ReportCard 
                key={report.path} 
                {...report} 
                isFavorite={favorites.includes(report.path)}
                onToggleFavorite={handleToggleFavorite}
                onReportClick={handleReportClick}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-16 bg-gray-50/30 rounded-2xl border border-dashed border-gray-200/80">
            <div className="size-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
              <Search className="size-6" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 font-sans">No reports found</h3>
            <p className="text-xs text-gray-500 font-sans mt-1 text-center max-w-xs">
              No reports match your current search queries or selected category.
            </p>
          </div>
        )}
      </div>
    </Container>
  );
}
