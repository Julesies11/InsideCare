import { Container } from '@/components/common/container';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router';
import { 
  FileText, 
  Users, 
  Activity, 
  ShieldCheck, 
  ClipboardList, 
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';
import { RBAC_MODULES } from '@/config/rbac-modules';
import { cn } from '@/lib/utils';

interface ReportCardProps {
  title: string;
  description: string;
  icon: any;
  path: string;
  category: string;
  permission: string;
  implemented?: boolean;
}

function ReportCard({ title, description, icon: Icon, path, category, permission, implemented = true }: ReportCardProps) {
  const navigate = useNavigate();
  const { canView } = usePermissions();

  if (!canView(permission)) return null;

  return (
    <Card 
      className={cn(
        "transition-colors",
        implemented ? "hover:border-primary cursor-pointer group" : "opacity-60 cursor-not-allowed bg-gray-50 border-gray-100 shadow-none"
      )} 
      onClick={() => implemented && navigate(path)}
    >
      <CardContent className="p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center transition-colors",
              implemented ? "bg-gray-100 text-gray-600 group-hover:bg-primary/10 group-hover:text-primary" : "bg-gray-200/50 text-gray-400"
            )}>
              <Icon className="size-6" />
            </div>
            <div className="flex gap-2 items-center">
              {!implemented && (
                <Badge variant="secondary" className="uppercase text-[9px] font-black tracking-widest text-gray-500 bg-gray-200">
                  Coming Soon
                </Badge>
              )}
              <Badge variant="outline" className={cn("uppercase text-[10px] font-bold tracking-wider", !implemented && "text-gray-400 border-gray-200")}>
                {category}
              </Badge>
            </div>
          </div>
          <div>
            <h3 className={cn("text-lg font-bold transition-colors", implemented ? "text-gray-900 group-hover:text-primary" : "text-gray-500")}>
              {title}
            </h3>
            <p className={cn("text-sm mt-1", implemented ? "text-gray-500" : "text-gray-400")}>
              {description}
            </p>
          </div>
          {implemented && (
            <div className="flex items-center text-primary font-medium text-sm mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              Run Report <ArrowRight className="size-4 ms-2" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function ReportingHubPage() {
  const reports: ReportCardProps[] = [
    {
      title: 'Incident Management',
      description: 'Summary of accidents, medical incidents, and restrictive practices.',
      icon: AlertTriangle,
      path: '/reporting/clinical/incidents',
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
      title: 'Staff Roster Summary',
      description: 'Overview of rostered hours and coverage across houses.',
      icon: Users,
      path: '/reporting/operational/roster',
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
  ];

  return (
    <Container className="py-6">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-gray-900">Reporting Hub</h1>
          <p className="text-gray-500 text-base">
            Generate and export comprehensive reports for clinical oversight and operational management.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report, idx) => (
            <ReportCard key={idx} {...report} />
          ))}
        </div>
      </div>
    </Container>
  );
}
