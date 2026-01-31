import { StatCard } from "./StatCard"
import { MotivationalBanner } from "./MotivationalBanner"
import { AlertBanners } from "./AlertBanners"
import { RecentActivity } from "./RecentActivity"
import { UpcomingSchedule } from "./UpcomingSchedule"
import { Users, UserCheck, AlertTriangle, CheckSquare } from "lucide-react"

interface DashboardProps {
  onPageChange?: (page: string) => void
}

export function Dashboard({ onPageChange }: DashboardProps = {}) {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Motivational Banner */}
      <MotivationalBanner />

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div onClick={() => onPageChange?.('participant-profiles')} className="cursor-pointer">
          <StatCard
            title="Clients"
            value={20}
            icon={Users}
            color="bg-blue-500"
            emoji="👤"
          />
        </div>
        <div onClick={() => onPageChange?.('staff-profiles')} className="cursor-pointer">
          <StatCard
            title="Staff"
            value={15}
            icon={UserCheck}
            color="bg-green-500"
            emoji="👥"
          />
        </div>
        <div onClick={() => onPageChange?.('incident-reports')} className="cursor-pointer">
          <StatCard
            title="Incidents"
            value={5}
            icon={AlertTriangle}
            color="bg-orange-500"
            emoji="⚠️"
          />
        </div>
        <div onClick={() => onPageChange?.('reports')} className="cursor-pointer">
          <StatCard
            title="Tasks"
            value={3}
            icon={CheckSquare}
            color="bg-purple-500"
            emoji="✅"
          />
        </div>
      </div>

      {/* Motivational Quote */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 mb-6 border border-green-100">
        <div className="text-center">
          <p className="text-lg text-gray-700 italic">
            "Every task you complete today, helps someone feel safer tomorrow."
          </p>
          <div className="flex justify-center mt-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Banners */}
      <div className="mb-6">
        <AlertBanners />
      </div>

      {/* Recent Activity and Schedule */}
      <div className="grid lg:grid-cols-2 gap-6">
        <RecentActivity />
        <UpcomingSchedule />
      </div>
    </div>
  )
}