import { useAuth } from '@/auth/context/auth-context';
import { CheckSquare, ClipboardList, UserCheck, Users } from 'lucide-react';
import { useNavigate } from 'react-router';
import { ROUTES } from '@/config/routes.config';
import { useParticipantsCount } from '@/hooks/use-participants';
import { useStaffCount } from '@/hooks/use-staff';
import {
  MotivationalBanner,
  RecentActivity,
  StatCard,
  UpcomingShifts,
  WelcomeBanner,
} from './components';

export function HomeContent() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  // Optimized count-only fetching
  const { count: participantCount } = useParticipantsCount({
    statuses: ['active'],
  });
  const { count: staffCount } = useStaffCount({ statuses: ['active'] });

  return (
    <div className="grid gap-5 lg:gap-7.5">
      <WelcomeBanner />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-7.5">
        <StatCard
          title="Active Participants"
          value={participantCount}
          icon={Users}
          color="bg-blue-500"
          onClick={() => navigate(ROUTES.PARTICIPANT_PROFILES)}
        />
        <StatCard
          title="Active Staff"
          value={staffCount}
          icon={UserCheck}
          color="bg-green-500"
          onClick={() => navigate(ROUTES.STAFF)}
        />
        {isAdmin && (
          <>
            <StatCard
              title="Pending Timesheets"
              value="8"
              icon={ClipboardList}
              color="bg-orange-500"
              onClick={() => navigate(ROUTES.TIMESHEET_APPROVALS)}
            />
            <StatCard
              title="Leave Requests"
              value="3"
              icon={CheckSquare}
              color="bg-purple-500"
              onClick={() => navigate(ROUTES.LEAVE_APPROVALS)}
            />
          </>
        )}
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
