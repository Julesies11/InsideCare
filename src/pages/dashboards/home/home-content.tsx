import { useNavigate } from 'react-router-dom';
import { Users, UserCheck, AlertTriangle, CheckSquare } from 'lucide-react';
import { WelcomeBanner, StatCard, MotivationalBanner, RecentActivity, UpcomingShifts } from './components';
import { useParticipants } from '@/hooks/use-participants';
import { useStaff } from '@/hooks/useStaff';

export function HomeContent() {
  const navigate = useNavigate();
  
  // Fetch active participants (large pageSize to get total count)
  const { count: participantCount } = useParticipants(0, 1000, [], { statuses: ['active'] });
  
  // Fetch active staff (large pageSize to get total count)
  const { count: staffCount } = useStaff(0, 1000, [], { statuses: ['active'] });

  return (
    <div className="grid gap-5 lg:gap-7.5">
      <WelcomeBanner />

      <div className="grid grid-cols-2 lg:grid-cols-2 gap-5 lg:gap-7.5">
        <StatCard
          title="Active Participants"
          value={participantCount}
          icon={Users}
          color="bg-blue-500"
          onClick={() => navigate('/participants/profiles')}
        />
        <StatCard
          title="Active Staff"
          value={staffCount}
          icon={UserCheck}
          color="bg-green-500"
          onClick={() => navigate('/employees/staff-profiles')}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-5 lg:gap-7.5 items-start">
        <div className="lg:col-span-1">
          <UpcomingShifts />
        </div>
        <div className="lg:col-span-2 space-y-5 lg:gap-7.5">
          <MotivationalBanner />
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}
