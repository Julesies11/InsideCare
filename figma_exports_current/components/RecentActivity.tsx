import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Upload, AlertTriangle, FileText, Clock } from "lucide-react"

const activities = [
  {
    id: 1,
    icon: Upload,
    iconColor: "text-green-600",
    iconBg: "bg-green-100",
    title: "Joseph's Driver's License uploaded",
    time: "1 hour ago"
  },
  {
    id: 2,
    icon: AlertTriangle,
    iconColor: "text-orange-600",
    iconBg: "bg-orange-100",
    title: "Incident lodged by Margaret",
    time: "2 hours ago"
  },
  {
    id: 3,
    icon: FileText,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-100",
    title: "Support Plan updated for Miriam",
    time: "2 hours ago"
  },
  {
    id: 4,
    icon: Upload,
    iconColor: "text-green-600",
    iconBg: "bg-green-100",
    title: "Medical certificate submitted by David",
    time: "3 hours ago"
  },
  {
    id: 5,
    icon: FileText,
    iconColor: "text-purple-600",
    iconBg: "bg-purple-100",
    title: "Weekly report generated",
    time: "4 hours ago"
  }
]

export function RecentActivity() {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-80 overflow-y-auto">
          {activities.map((activity) => {
            const Icon = activity.icon
            return (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={`p-2 rounded-full ${activity.iconBg} flex-shrink-0`}>
                  <Icon className={`h-4 w-4 ${activity.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    {activity.title}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {activity.time}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}