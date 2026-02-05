import { useNavigate } from 'react-router-dom';
import { Users, UserCheck, AlertTriangle, CheckSquare } from 'lucide-react';
import { WelcomeBanner, StatCard, MotivationalBanner, RecentActivity } from './components';
import { useParticipants } from '@/hooks/use-participants';
import { useStaff } from '@/hooks/useStaff';

export function HomeContent() {
  const navigate = useNavigate();
  const { participants } = useParticipants();
  const { staff } = useStaff();

  const participantCount = participants?.length || 0;
  const staffCount = staff?.length || 0;

  return (
    <div className="grid gap-5 lg:gap-7.5">
      <WelcomeBanner />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-7.5">
        <StatCard
          title="Participants"
          value={participantCount}
          icon={Users}
          color="bg-blue-500"
          onClick={() => navigate('/participants/profiles')}
        />
        <StatCard
          title="Staff"
          value={staffCount}
          icon={UserCheck}
          color="bg-green-500"
          onClick={() => navigate('/employees/staff-profiles')}
        />
        <StatCard
          title="Incidents"
          value={0}
          icon={AlertTriangle}
          color="bg-orange-500"
          disabled
        />
        <StatCard
          title="Tasks"
          value={0}
          icon={CheckSquare}
          color="bg-purple-500"
          disabled
        />
      </div>

      <MotivationalBanner />
      
      <div className="grid lg:grid-cols-1 gap-5 lg:gap-7.5">
        <RecentActivity />
      </div>
    </div>
  );
}
